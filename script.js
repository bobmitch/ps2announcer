
// pre load vehicles, item categories and profiles

var profiles = {};
profiles_raw.profile_list.forEach(profile => {
    profiles[profile.profile_id] = profile;
});

var vehicles = {};
vehicles_raw.vehicle_list.forEach(vehicle => {
    vehicles[vehicle.vehicle_id] = vehicle;
});

var item_categories = {};
item_categories_raw.item_category_list.forEach(cat => {
    item_categories[cat.item_category_id] = cat;
});

var weapons = {};
weapons_raw.item_list.forEach(item => {
    weapons[item.item_id] = item;
});

var loadouts = {};
loadouts_raw.loadout_list.forEach(loadout => {
    loadouts[loadout.loadout_id] = loadout;
});

// load options

var playerlist = JSON.parse(localStorage.getItem('ps2_players'));
if (playerlist===null) {
    playerlist = [];
}
var ps2_extraaudio = JSON.parse(localStorage.getItem('ps2_extraaudio'));
if (ps2_extraaudio===null) {
    ps2_extraaudio = [];
}

// setup global vars

var killstreak=0; // reset by death
var spamstreak=0;
var kills=0;
var deaths=0;
var kd=1;
var max_killstreak=0;
var assist_streak=0;
var revive_count_streak=0; // reset by death
var mines_destroyed=0;
var proxy_kills_streak=0; // reset by death
var assist_streak=0; // reset by death
var rocket_kills_streak=0; // reset by death
var ground_vs_infantry_streak=0; // reset by death
var ground_vs_infantry=0; 
var air_vs_air_streak=0; // reset by death
var air_vs_air=0; 
var air_vs_ground_streak=0; // reset by death
var air_vs_ground;
var spot_kill_count=0;
var motion_sensor_kills=0;
var characters={};
var synth = window.speechSynthesis;
//var achievements = {};
var new_achievements = [];
var cur_achievements = []; // per event stack of triggered achievements - sorted by 

var last_kill_timestamp = 0;
var multikills = 0;
var multikill_window = 10; // secs to multikill reset
var ragequit_watchlist = {};


function insert_row (data, msg) {         
    var events_table = document.getElementById('events');
    var cls='';
    var pills='';

    if (msg) {
        var row=events_table.insertRow();
        row.className += cls;
        var time = row.insertCell();
        var event = row.insertCell();
        var special = row.insertCell();
        if (data) {
            time.innerHTML = nice_date(data.payload.timestamp);
        }
        else {
            time.innerHTML = Date();
        }
        event.innerHTML = msg;

        cur_achievements.forEach(achievement_on_stack => {
            //console.log('putting pill for achievement ', achievement_on_stack);
            pills += `
            <span class='tag is-dark'>${achievement_on_stack.name}</span>
            `;
        });

        special.innerHTML = pills;
    }
}


function get_weapon_type (category_id) {
    if (item_categories.hasOwnProperty(category_id)) {
        return item_categories[category_id].name.en;
    }
    else {
        return "[unknown]";
    }
}

function is_esf (vehicle_id) {
    // if faction esf or interceptor variant
    return ["7","8","9","2122","2123","2124"].includes(vehicle_id);
}


function Achievement(id, name, description, trigger, soundfiles=['ting.mp3'], priority=10, interruptable=false) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.soundfiles = soundfiles;
    this.sounds = [];
    this.priority=priority;
    this.interruptable = interruptable;
    this.enabled = true;
    if (trigger) {
        this.triggered = trigger;
    }
    window.new_achievements.push(this);
};

Achievement.prototype.triggered = function() {
    // return true or false
    return false;
};

Achievement.prototype.trigger = function() {
    /* console.log ('Triggered achievement:');
    console.log (this); */
    has_external = false;
    for (n=0; n<this.sounds.length; n++) {
        if (!this.sounds[n].src.includes('bobmitch.com')) {
            has_external=true;
        }
    }
    if (!has_external) {
        // default only
        random_sound_index = Math.floor(Math.random() * this.sounds.length);
        this.sounds[random_sound_index].play();
    }
    else {
        // pick random until external found
        random_sound_index = Math.floor(Math.random() * this.sounds.length);
        while (this.sounds[random_sound_index].src.includes('bobmitch.com')) {
            random_sound_index = Math.floor(Math.random() * this.sounds.length);
        }
        this.sounds[random_sound_index].play();
    }
};

// define achievments


//
var roadkill = new Achievement('roadkill','Roadkill!','Squished someone with a ground vehicle!', function (event) {
    // latest event is current
    var l = window.allevents.length;
    if (is_kill(event)) {
        if (!tk(event)) {
            if (event.payload.attacker_weapon_id=="0") {
                if (event.payload.attacker_vehicle_id!="0") {
                    vh = get_local_vehicle (event.payload.attacker_vehicle_id);
                    if (vh.type_name=="Four Wheeled Ground Vehicle") {
                        return true;
                    }
                }
            }
        }
    }
    return false;
},['roadkill.mp3'],15);

var revenge = new Achievement('revenge','Revenge!','Killed someone who killed you before!', function (event) {
    // latest event is current
    var l = window.allevents.length;
    if (is_kill(event)) {
        for (n=l-2;n>=0;n--) {
            // -2, because current event is already on stack
            if (!is_kill(window.allevents[n])) {
                if (event.payload.character_id==window.allevents[n].payload.attacker_character_id) {
                    // if current event victim = old event attacker...
                    return true;
                }
            }
        }
    }
    return false;
},['Just Pout.ogg'],15);

// https://dl.dropbox.com/s/l8ko7l9c7rxuh7m/payback%27s-a-bitch-ain%27t-it.mp3

var antiair = new Achievement('antiair','Clear Skies!','Killed an aircraft!', function (event) {
    if (is_player(event.payload.attacker_character_id)) {
        if (!tk(event) && (event.payload.event_name=='VehicleDestroy')) {
            if (event.payload.attacker_vehicle_id=='')
            var vh = get_local_vehicle(event.payload.vehice_id);
            if (vh) {
                if (vh.type_name=="Light Aircraft") {
                    return true;
                }
            }
        }
    }
    return false;
},['land_your_plane.mp3','crash_and_burn_mav.mp3','keep-the-skies-clear.mp3','flying_dying.mp3'],4);

var topgun = new Achievement('topgun','Top Gun!','Destroyed an ESF with an ESF!', function (event) {
    if (is_player(event.payload.attacker_character_id)) {
        if (!tk(event) && (event.payload.event_name=='VehicleDestroy')) {
            if (is_esf(event.payload.vehicle_id) && is_esf(event.payload.attacker_vehicle_id)) {
                return true;
            }
        }
    }
    return false;
},['congrats_top_gun.mp3','im_a_pilot.mp3','planes_no_place_for_boys.mp3'],4);

var ragequit = new Achievement('ragequit','Ragequit!','You killed someone who left almost straight away!', function (event) {
    if (event.payload.event_name=="PlayerLogout") {
        console.log('Potential ragequit - check against ragequit_watchlist list for ', event);
        if (ragequit_watchlist.hasOwnProperty(event.payload.character_id)) {
            time_since_added_to_list = parseInt(event.payload.timestamp) - parseInt(ragequit_watchlist[event.payload.character_id]);
            console.log ('Watchlist - time since added is ',time_since_added_to_list);
            if (time_since_added_to_list>15) {
                // they were on the list, but they are still playing, so remove from list
                unsubscribe(event.payload.character_id);
                delete ragequit_watchlist[event.payload.character_id];
            }
            else {
                return true;
            }
        }
        // clear all old ragequit subscriptions and watches
        for (const potential_rager in ragequit_watchlist) {
            //console.log(`${potential_rager}: ${ragequit_watchlist[potential_rager]}`);
            time_since_added_to_list = parseInt(event.payload.timestamp) - parseInt(ragequit_watchlist[potential_rager]);
            if (time_since_added_to_list>15) {
                unsubscribe(potential_rager);
                delete ragequit_watchlist[potential_rager];
            }
        }
    }
    return false;
},['solong.mp3'],5);

var decikills = new Achievement('pentakill','PentaKill!','5 unanswered kills in a row!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (killstreak==5) {
            return (true);
        }
    }
    return false;
},['five_long.mp3'],4);

var decakills = new Achievement('decakill','DecaKill!','10 unanswered kills in a row!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (killstreak==10) {
            return (true);
        }
    }
    return false;
},['No One Could have Survived.ogg'],4);

var doublekill = new Achievement('doublekill','Double Kill!','2 kills in quick succession!', function (event) {
    //console.log('checking for double kill - current multikills = ',multikills);
    if (is_kill(event) && !tk(event)) {
        //console.log('...you got a kill... checking multikills count==2....');
        if (multikills==1) {
            return (true);
        }
    }
    return false;
},['two.mp3'],3);
var triplekill = new Achievement('triplekill','Triple Kill!','3 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==2) {
            return (true);
        }
    }
    return false;
},['three.mp3'],3);
var multikill = new Achievement('multikill','Multi Kill!','4 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==3) {
            return (true);
        }
    }
    return false;
},['four.mp3'],3);
var megakill = new Achievement('megakill','Mega Kill!','5 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==4) {
            return (true);
        }
    }
    return false;
},['five.mp3'],3);
var ultrakill = new Achievement('ultrakill','Ultra Kill!','6 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==5) {
            return (true);
        }
    }
    return false;
},['six.mp3'],3);
var monsterkill = new Achievement('monsterkill','Monster Kill!','7 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==6) {
            return (true);
        }
    }
    return false;
},['count_laughing.mp3'],3);
var ludicrous = new Achievement('ludicrous','Ludicrous Kill!','7 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==7) {
            return (true);
        }
    }
    return false;
},['count_laughing.mp3'],3);
var holyshit = new Achievement('holyshit','Holy Shit!','9 kills in quick succession!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (multikills==8) {
            return (true);
        }
    }
    return false;
},['nine.mp3'],3);



var sneaker_kill = new Achievement('sneaker','Sneaker!','You killed an invisible pussy!', function (event) {
    if (!is_kill(event)) {
        return false;
    }
    if (tk(event)) {
        return false;
    }
    if (event.payload.character_loadout_id=='1' || event.payload.character_loadout_id=='8' || event.payload.character_loadout_id=='15'|| event.payload.character_loadout_id=='190') {
        // 1,8.15,190 = infil loadouts - 190 = ns
        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
        return true;
    }
},['Low Profile.ogg','invisibleman.mp3'],20);

var headshot_ach = new Achievement('headshot','Headshot!','You got a headshot kill!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (event.payload.is_headshot=='1') {
            return (true);
        }
    }
    return false;
},['pew.mp3'],10);

var nocar = new Achievement('nocar',"Dude, where's my car?",'You killed a harasser!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (is_player(event.payload.attacker_character_id)) {
            if (vehicles[event.payload.vehicle_id].name.en=="Harasser") {
                return (true);
            }
        }
    }
    return false;
},['VOLUME_Dude wheres my car.wav'],20);

var killed_by_shotgun = new Achievement('redmist','Red Mist!','You got killed by a shotgun!', function (event) {
    if (!is_kill(event) && event.payload.event_name=="Death") {
        type = get_weapon_type(event.payload.attacker_weapon_id);
        if (type=="Shotgun") {
            return true;
        }
    }
    return false;
},['rudeness.mp3','bus-driver-crap.mp3']);

var badspam = new Achievement('badspam',"I Don't Like Spam!",'You got killed by a Lasher!', function (event) {
    if (!is_kill(event) && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=='7540') {
            return true;
        }
    }
    return false;
},['spam1.mp3','spam2.mp3','spam3.mp3']);

var goodspam = new Achievement('goodspam','Good Spam!','You spammed 5 people to death with the Lasher!', function (event) {
    if (is_kill(event) && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=='7540') {
            spamstreak++;
            if (spamstreak>0 && spamstreak%5==0) {
                return true;
            }
        }
        else {
            spamstreak=0;
        }
    }
    return false;
},['goodspam.mp3']);

var reviver = new Achievement('revive','Revive!','You revived someone!', function (event) {
    if (event.payload.event_name=="GainExperience" && is_player(event.payload.character_id)) {
        // 7 = revive, 57 = squad revive
        if (event.payload.experience_id=='7' || event.payload.experience_id=='53' ) {
            window.revive_count_streak++;
            console.log ('Triggered revive:');
            return true;
        }
    }
    return false;
},['xp.mp3','Bwup!.ogg'],['To a Zone... one of Danger.ogg'],20);

var repeat = new Achievement('repeatcustomer','Repeat Customer!','You killed the same person multiple times!', function (event) {
    var l = window.allevents.length;
    if (l<3) {
        return false;
        // cannot be repeat at start of tracking :)
    }
    if (is_kill(event) && !tk(event)) {
        for (n=l-2;n>=0;n--) {
            // -2, because current event is already on stack
            if (is_kill(window.allevents[n]) && !tk(window.allevents[n])) {
                if (event.payload.character_id==window.allevents[n].payload.character_id) {
                    return (true);
                }
            }
        }
    }
    return false;
},['Whats Up_ Whattya been doin_.ogg'],20);

var assister = new Achievement('helper','Santas Little Helper!','You assisted killing someone 5 times in a row without killing anybody yourself!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 2 assist, 371 priority assist
        if (event.payload.experience_id=='2' || event.payload.experience_id=='371') {
            assist_streak++;
            if (assist_streak%5==0 && assist_streak>0) {
                var msg = "You are Santa's Little Helper! 5 assists in a row without any kills yourself!";
                //msg += print_character(event.character_id);
                insert_row (event, msg);
                return true;
            }
        }
    }
    return false;
},['helper.mp3'],5);

var blinder = new Achievement('blinder','Blinded, With Science!','You blinded someone by killing their motion spotter!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 293 motion detect, 370 kill motion spotter, 294 squad motion detect
        if ( (event.payload.experience_id=='370') ) {
            //console.log(event);
            //console.log ('Triggered stevie wonder:');
            var msg = "You blinded ";
            msg += print_character(event.payload.other_id);
            insert_row (event, msg);
            return true;
        }
    }
    return false;
},['SheBlindedMe.mp3']);

var hatebombs = new Achievement('hatebombs','Bomb Disposal!','You killed someones explosive device!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 293 motion detect, 370 kill motion spotter, 294 squad motion detect
        if ( (event.payload.experience_id=='86')) {
            console.log(event);
            console.log ('Triggered bomb disposal:');
            var msg = "You defused ";
            msg += print_character(event.payload.other_id);
            insert_row (event, msg);
            return true;
        }
    }
    return false;
},['mine_long.mp3']);

var tk_sound = new Achievement('teamkill','Teamkill!','You killed a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && tk(event)) {
            return true;
        }
    }
    return false;
},['My Bad! Thats on me.ogg','count_sorry.mp3','no_friends_count.mp3']);

var welcome = new Achievement('welcome','Welcome To Planetside!','You killed someone new to the game!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event)) {
            if (characters[event.payload.character_id].character_list[0].battle_rank.value < 6) {
                return true;
            }
        }
    }
    return false;
},['Prospective Investor.ogg']);


var shitter = new Achievement('shitter','Shitter Dunk!','You killed someone with a good KDR!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event)) {
            stats_history = characters[event.payload.character_id].character_list[0].stats.stat_history;
            victim_kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            if (victim_kdr>2.5) {
                return true;
            }
        }
    }
    return false;
},['Just Pout.ogg','PAM - yeehhh, sploosh.ogg'],5);

var mutual = new Achievement('mutual','Mutually Assured Destruction!','You killed another player at the same time as he killed you!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event) && allevents.length>=2) {
            // your kill, check previous event for death at same time
            prev = allevents[allevents.length-2];
            if (prev.payload.timestamp==event.payload.timestamp) {
                // same time
                if (prev.payload.event_name=="Death" && is_player (prev.payload.character_id)) {
                    // you died prev
                    if (prev.attacker_character_id==event.payload.character_id) {
                        // to the same guy you killed
                        return true;
                    }
                }
            }
        }
        if (!is_kill(event) && !tk(event) && allevents.length>=2) {
            // you died, check for a kill prev event
            prev = allevents[allevents.length-2];
            if (prev.payload.timestamp==event.payload.timestamp) {
                // same time
                if (prev.payload.event_name=="Death" && !is_player (prev.payload.character_id)) {
                    // you killed in prev
                    if (is_kill(prev) && !tk(prev)) {
                        if (prev.character_id==event.payload.attacker_character_id) {
                            // and it was the same dude that killed you...
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
},['aallrighty.mp3'],10);

// end of define achievments

// replace sound filenames in achievements with actual audio elements
new_achievements.forEach(achievement => {
    if (achievement.hasOwnProperty('soundfiles')) {
        for (n=0; n<achievement.soundfiles.length; n++) {
            if (achievement.soundfiles[n].toLowerCase().startsWith('http')) {
                // external mp3
                achievement.sounds[n] = new Audio(achievement.soundfiles[n]);
            }
            else {
                achievement.sounds[n] = new Audio('https://bobmitch.com/ps2/audio/' + achievement.soundfiles[n]);
            }
            achievement.sounds[n].crossOrigin = 'anonymous';
        }
    }
});

load_config(); // important - do this after previous built-in hardcoded achievements have been created :)

function reset_streaks() {
    revive_count_streak=0;
}

function allow_voicepack() {
    console.log('User interaction given for audio');
    say ('Audio enabled');
}


function say(txt) {
    var utterThis = new SpeechSynthesisUtterance(txt);
    window.synth.speak(utterThis);
}

function nice_date(timestamp) {
    var date = new Date(timestamp*1000);
    //var iso = date.toISOString().match(/(\d{4}\-\d{2}\-\d{2})T(\d{2}:\d{2}:\d{2})/);
    //return (iso[1] + ' ' + iso[2]);
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

function print_character(character_id) {
    var char = '';
    if (!characters[character_id].hasOwnProperty('character_list')) {
        console.log ('Character ', character_id, ' has no character list array');
        return '[unknown]';
    }
    if (characters[character_id].character_list.length==0) {
        console.log ('Character ', character_id, ' has empty character list array');
        return '[unknown]';
    }
    char_profile = profiles[ characters[character_id].character_list[0].profile_id ].name.en;
    char+="<span class='"+char_profile+"'>" + char_profile + "</span>";
    char+='<span class="char faction'+characters[character_id].character_list[0].faction_id+'"> ';
        char+='<span class="charname">';
        if (characters[character_id].character_list[0].hasOwnProperty('outfit')) {
            char+='<span class="outfit">'+characters[character_id].character_list[0].outfit.alias+'</span>&nbsp;';
        }
        char+= characters[character_id].character_list[0].name.first+'</span> ';
        char+='<span class="br">BR:'+characters[character_id].character_list[0].battle_rank.value+'</span> ';
        //char+='</span>';

        stats_history = characters[character_id].character_list[0].stats.stat_history;
        kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
        char+='<span class="br kdr">KDR: ' + kdr + '</span>'
    char+='</span>';
    //console.log(char);
    return char;
}

function tk(event) {
    if (!event.payload.event_name=='Death') {
        return false;
    }
    var attacker_loadout_id=event.payload.attacker_loadout_id;
    var victim_loadout_id=event.payload.character_loadout_id;
    /* console.log('new tk event test');
    console.log(event);
    console.log(attacker_loadout_id);
    console.log(victim_loadout_id); */
    if (loadouts[parseInt(attacker_loadout_id)].faction_id==loadouts[parseInt(victim_loadout_id)].faction_id) {
        return true;
    }
    else {
        return false;
    }
}


function get_local_vehicle(vehicle_id) {
    if (vehicles.hasOwnProperty(vehicle_id)) {
        return vehicles[vehicle_id];
    }
    else {
        return false;
    }
}

function get_vehicle_name(vehicle_id) {
    if (vehicles.hasOwnProperty(vehicle_id)) {
        return vehicles[vehicle_id].name.en;
    }
    else {
        console.log('unknown vehice id: ',vehicle_id);
    }
    return '[Unknown]';
}


function display_event(data) {
    //console.log(data);
    
    // get all data needed to display and handle logic
    if (!data.payload.hasOwnProperty('vehicle_id')) {
        // make sure vehicle id exists, if it doesn't, make it zero
        data.payload.vehicle_id="0";
    }
    if (data.payload.event_name=="GainExperience") {
        // pretend other stuff doesnt exists
        data.payload.vehicle_id="0";
        data.payload.attacker_vehicle_id="0";
        //data.payload.character_id="0"; // this exists
        data.payload.attacker_character_id="0";
        data.payload.attacker_weapon_id="0";
    }
    var other_id=0;
    if (data.payload.hasOwnProperty('other_id')) {
        other_id = data.payload.other_id;
    }
    jQuery.when(get_vehicle(data.payload.vehicle_id),get_vehicle(data.payload.attacker_vehicle_id),get_character(data.payload.character_id), get_character(data.payload.other_id), get_character(data.payload.attacker_character_id), get_weapon(data.payload.attacker_weapon_id) ).then(function(){
        // all promised data available, show event
        //console.log ('All promises handled, doing logic now');

        process_event(data);
        
        // can also access triggered achievements by this event here: window.cur_achievements - this is cleared next event

        var events_table_body = document.getElementById('events_body');          
        var events_table = document.getElementById('events');
        var cls='';
        var msg='';
        var pills='';

        
        if (data.payload.event_name=="GainExperience") {
            // 34/55 - resupply
            // 19 capture facility
            // check for revive - id 7 + 57
            // 557 objective pulse capture
            if ( (data.payload.experience_id=='7' || data.payload.experience_id=='57') && is_player(data.payload.character_id)) {
                /* console.log('REVIVE EVENT:');
                console.log(data.payload); */
                msg+='You revived ';
                cls+=' info ';
                msg+=print_character(data.payload.other_id);
                revive_count_streak++;
            }
            else if (data.payload.experience_id=='2' && is_player(data.payload.character_id)) {
                assist_streak++;
            }
        }		
        if (data.payload.event_name=='Death') {

            //console.log ('Comparing ' + data.payload.attacker_character_id + ' to ' + window.char);
            if (is_player(data.payload.attacker_character_id)) {
                msg+='You killed ';
                if (is_player(data.payload.character_id)) {
                //if (data.payload.character_id==window.char) {
                    // suicide
                    cls+=' death ';
                    msg+=' yourself ';
                }
                else {
                    // player kill
                    //say_or_play('ha','per_kill');
                    if (tk(data)) {
                        msg = "You teamkilled "
                        cls+=' tk ';
                    }
                    cls+=' kill ';
                    msg+= print_character(data.payload.character_id);
                    if (data.payload.is_headshot=="1") {
                        cls+=' headshot ';
                        //pills+='<span class="tag is-dark">headshot</span> '; // should be populated by achievement tag
                    }
                    // get weapon
                    if (data.payload.attacker_weapon_id!="0") {
                        weapon = weapons[data.payload.attacker_weapon_id];
                        type = get_weapon_type (weapon.item_category_id);
                        msg+= ' <span>'+weapons[data.payload.attacker_weapon_id].name.en+' <span class="weapon_type">('+type+')</span></span> ';
                    }
                    else if (data.payload.attacker_vehicle_id!='0') {
                        // maybe got squished
                        vehicle_name = get_vehicle_name(data.payload.attacker_vehicle_id);
                        msg+= ' with your ' + vehicle_name + '</span>';
                    }
                    else {
                        msg+= ' using just your mind!</span> ';
                    }
                    if (data.payload.character_loadout_id=='1' || data.payload.character_loadout_id=='8' || data.payload.character_loadout_id=='15') {
                        // 1,8.15 = infil loadouts
                        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
                        //pills+='<span class="tag is-dark">sneaker</span>';
                    }
                }
            }
            else {
            
                cls+=' death ';
                msg += 'You were killed by ';
                msg+=print_character(data.payload.attacker_character_id);
                // get weapon
                if (data.payload.attacker_weapon_id!='0') {
                    weapon = weapons[data.payload.attacker_weapon_id];
                    type = get_weapon_type (weapon.item_category_id);
                    msg+= ' using <span>'+weapons[data.payload.attacker_weapon_id].name.en+'</span> <span class="weapon_type"> ('+type+')</span> ';
                }
                else if (data.payload.attacker_vehicle_id!='0') {
                    // maybe got squished
                    vehicle_name = get_vehicle_name(data.payload.attacker_vehicle_id);
                    msg+= ' in their ' + vehicle_name + '</span>';
                }
                else {
                    msg+=' with nothing at all!';
                }
            }
        }
        if (data.payload.event_name=='VehicleDestroy') {
            if (is_player(data.payload.character_id)) {
            //if (data.payload.character_id==window.char) {
                msg+='Your <span>'+vehicles[data.payload.vehicle_id].name.en+'</span> was destroyed by ';
                msg+=print_character(data.payload.attacker_character_id);
            }
            else {
                msg+='You destroyed ';
                msg+=print_character(data.payload.character_id);
                vehicle_name = get_vehicle_name(data.payload.vehicle_id);
                msg+="'s<span> "+vehicle_name+'</span> ';
                
                if (data.payload.attacker_weapon_id!="0") {
                    weapon = weapons[data.payload.attacker_weapon_id];
                    type = get_weapon_type (weapon.item_category_id);
                    msg+= ' using <span>'+weapons[data.payload.attacker_weapon_id].name.en+'</span> <span class="weapon_type">('+type+')</span> ';
                }
                else if (data.payload.attacker_vehicle_id!='0') {
                    // maybe got squished
                    vehicle_name = get_vehicle_name(data.payload.attacker_vehicle_id);
                    msg+= ' with your ' + vehicle_name + '</span>';
                }
                else {
                    msg+= ' using just your mind.';
                }
            }
            
        }
        if (msg) {
            var row=events_table.insertRow();
            row.className += cls;
            var time = row.insertCell();
            var event = row.insertCell();
            var special = row.insertCell();
            time.innerHTML = nice_date(data.payload.timestamp);
            event.innerHTML = msg;

            cur_achievements.forEach(achievement_on_stack => {
                //console.log('putting pill for achievement ', achievement_on_stack);
                pills += `
                <span class='tag is-dark'>${achievement_on_stack.name}</span>
                `;
            });

            special.innerHTML = pills;
        }

    });
}

function get_character (character_id) {
    // check if character_id already in local cache
    // no local, so need to get then update

    if (window.characters.hasOwnProperty(character_id)) {
        // have local
        //return dfd.resolve(window.characters[character_id]);
        if (window.characters[character_id].hasOwnProperty('character_list')) {
            if (window.characters[character_id].character_list.length>0) {
                return window.characters[character_id];
            }
        }
    }
    else {
        // handle as promise
        var dfd = jQuery.Deferred();
        //var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/" + character_id + '?c:resolve=outfit&callback=?'; // works, just outfit and basic
        var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/" + character_id + '?c:resolve=outfit,stat_history&callback=?';
        //&stat_name=kills,deaths
        //console.log('Getting char info from census for ' + character_id);
        jQuery.getJSON(url,function(json){
            var character = json;
            //console.log('Got char info!');
            //console.log(character);
            window.characters[character_id] = character;
            dfd.resolve(character);
        });
        return dfd.promise();
    }
}

function get_weapon (weapon_id) {
    // check if weapon_id already in local cache
    // no local, so need to get then update
    /* if (1==0) {
        // have local
        return weapon;
    } */
    if (!weapon_id) {
        console.log('get_weapon called with:',weapon_id);
        return false;
    }
    if (window.weapons.hasOwnProperty(weapon_id)) {
        // have local
        //return dfd.resolve(window.characters[character_id]);
         return window.weapons[weapon_id];
    }
    else {
        if (weapon_id=="0") {
            return false;
        }
        // handle as promise
        console.log('no local weapon: ',weapon_id);
        var dfd = jQuery.Deferred();
        //https://census.daybreakgames.com/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&weapon_id=1
        var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&item_id=" + weapon_id + '&callback=?';
        //var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/item?c:lang=en&c:join=item_category&c:join=item_to_weapon(weapon)&c:limit=1&item_id=" + weapon_id + '&callback=?';
        //console.log('Getting char info from census for ' + character_id);
        jQuery.getJSON(url,function(json){
            var weapon = json;
            console.log('got remote weapon:',weapon);
            console.log(weapon);
            window.weapons[weapon_id] = weapon.item_list[0];
            dfd.resolve(weapon);
        });
        return dfd.promise();
    }
        
}

function get_vehicle (vehicle_id) {
    if (!vehicle_id) {
        console.log('get_vehicle called with:',vehicle_id);
        return false;
    }
    if (window.vehicles.hasOwnProperty(vehicle_id)) {
        // have local
        //return dfd.resolve(window.characters[character_id]);
         return window.vehicles[vehicle_id];
    }
    else {
        if (vehicle_id=="0") {
            return false;
        }
        // handle as promise
        console.log('no local vehicle: ',vehicle_id);
        var dfd = jQuery.Deferred();
        //https://census.daybreakgames.com/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&weapon_id=1
        var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/vehicle?c:limit=1&vehicle_id=" + vehicle_id + '&callback=?';
        //console.log('Getting char info from census for ' + character_id);
        jQuery.getJSON(url,function(json){
            var vehicle_returned = json;
            console.log('got remote vehicle id ',vehicle_id);
            console.log(vehicle_returned);
            window.vehicles[vehicle_id] = vehicle_returned.vehicle_list[0];
            dfd.resolve(vehicle_returned);
        });
        return dfd.promise();
    } 
}

function get_player(char_id) {
    found = false;
    playerlist.forEach(player => {
        if (player.char_id==char_id) {
            found = player;
        }
    });
    return found;
}

function set_player_online (char_id, name="Unknown Player") {
    console.log('setting ',char_id,' online');
    player = get_player(char_id);
    if (player) {
        playername=player.name;
    }
    else {
        playername=name;
    }
    playername_el = document.getElementById('playername');
    console.log('setting player online:');
    console.log(playername);
    playername_el.innerText = playername;
    playername_el.classList.remove('offline');
    playername_el.dataset.char_id = char_id;
}

function set_player_offline (char_id) {
    player = get_player(char_id);
    playername_el = document.getElementById('playername');
    if (player) {
        playername_el.innerText = "Player Offline";
        playername_el.classList.add('offline');
        playername_el.dataset.char_id = "0";
    }
}

function get_player_online_state(char_id) {
    var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:resolve=online_status&character_id="+char_id+"&c:limit=1&callback=?";
    jQuery.getJSON(url,function(json){
        var search = json;
        console.log('player online state results:');
        console.log(search);
        if (search.character_list.length==0) {
            console.log('Character ID not found - online status cannot be determined');
        }
        else {
            if (search.character_list[0].online_status=='0') {
                // do nothing
            }
            else {
                set_player_online(char_id, search.character_list[0].name.first);
            }
        }
    });
}

function player_search(){
    var playername=jQuery('#playersearch').val();
    playername = playername.toLowerCase();
    //var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:join=characters_online_status&name.first_lower=%5E" + playername + "&c:limit=10&c:sort=name.first_lower&callback=?";
    var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:resolve=online_status&name.first_lower=%5E" + playername + "&c:limit=10&c:sort=name.first_lower&callback=?";
    jQuery('#playersearchresults').html('<p>Searching...</p>');
    jQuery.getJSON(url,function(json){
        var search = json;
        console.log(search);
        if (search.character_list.length==0) {
            alert('No matching players found');
        }
        html='<ul id="search_results_wrap">';
        for (n=0;n<search.character_list.length;n++) {
            if (search.character_list[n].online_status=='0') {
                cls=" offline ";
            }
            else {
                cls=' online ';
            }
            html+='<li><a class="'+cls+'" data-character_id="' +search.character_list[n].character_id + '" href="#' + search.character_list[n].character_id + '">' +search.character_list[n].name.first + '</a></li>';
        }
        if (search.character_list.length==0) {
            jQuery('#playersearchresults').html('<p>No matching players found</p>');
        }
        html+='</ul>';
        jQuery('#playersearchresults').html(html);
        jQuery('#playersearchresults').slideDown();
    });
}



function is_player(char_id) {
    var found = false;
    playerlist.forEach(player => {
        if (player.char_id==char_id) {
            found=true;
        }
    });
    return found;
}

function is_kill(event) {
    if (event.payload.event_name=='Death') {
        if (!is_player(event.payload.character_id)) {
        //if (event.payload.character_id!=window.char) {
            return (true);
        }
    }
    return (false);
}


// TODO
// backwards loop function (like those above) to set flags for ANY historical comparison
// so we only do one complete loop backwards and not many short and potentially long ones per test

function update_kd() {
    if (kills>0) {
        if (deaths==0) {
            kd=kills;
        }
        else {
            kd = (kills/deaths).toFixed(2);;
        }
    }
    else {
        kd=0;
    }

}

function process_event(event) {
    
    if (event.payload.event_name=="PlayerLogin") {
        say('Player logged in');
    }
    if (event.payload.event_name=="PlayerLogout") {
        if (is_player(event.payload.character_id)) {
            say('Player logged out');
            set_player_offline(event.payload.character_id);
        }
    }
    // update global values based on event
    if (event.payload.event_name=='Death') {
        if (is_player(event.payload.character_id)) {
            // you died
            window.killstreak=0;
            window.spamstreak=0;
            multikills=0;
            window.deaths++;
            update_kd();
        }
        else {
            if (!tk(event)) {
                // genuine kill
                window.killstreak++;
                window.kills++;
                update_kd();
                assist_streak=0; // end assist streak
                time_since_last_kill = parseInt(event.payload.timestamp) - parseInt(last_kill_timestamp);
                //console.log('time since last kill = ',time_since_last_kill);
                if (time_since_last_kill <= multikill_window) {
                    multikills++;
                }
                else {
                    multikills=0;
                }
                last_kill_timestamp = event.payload.timestamp;
                // subscribe to logout of player killed for ragequit
                // and add timestamp to watchlist
                subscribe_to_character_logout(event.payload.character_id);
                ragequit_watchlist[event.payload.character_id] = event.payload.timestamp;
            }
            else {
                say ('Teamkill');
            }
        }
    }
    // run achievement tests
    window.cur_achievements = []; // clear stack
    window.new_achievements.forEach(achievement => {
        /* console.log('Checking if achievement triggered: ');
        console.log(achievement); */
        // create list of achievements triggered by current event
        if (achievement.triggered(event)) {
            window.cur_achievements.push(achievement);
        }
        
    });
    // sort by priority
    // and trigger top enabled 
    window.cur_achievements.sort((a, b) => (a.priority > b.priority) ? 1 : -1)
    for (n=0; n<window.cur_achievements.length; n++) {
        if (window.cur_achievements[n].enabled) {
            window.cur_achievements[n].trigger();
            break;
        }
    }

    auto_updaters = document.querySelectorAll('.autoupdate');
    auto_updaters.forEach(auto => {
        variable = auto.dataset.variable;
        value = window[variable];
        auto.innerText = value;
    });
    
}

function unsubscribe(id) {
    var subscription_data = {
    "action":"clearSubscribe",
		"characters":[id],
		"eventNames":[
			"PlayerLogout"
        ]
    };
    window.logoutsocket.send (JSON.stringify(subscription_data));
}

function subscribe_to_character_logout(id) {
    // todo - monitor for rage quits
    subscribe_to_character(id,true);
}

function subscribe_to_character(id, logoutonly=false) {

    // clear existing subscription
    /* var subscription_data = {
        "action":"clearSubscribe",
        "all":"true",
        "service":"event"
    }
    window.socket.send (JSON.stringify(subscription_data)); */
    console.log('logoutonly: ',logoutonly);
    // subscribe to new char events
    if (logoutonly) {
        console.log('Subscribing to logout events only - for: ',id);
        var subscription_data = {
            "service":"event",
            "action":"subscribe",
            "characters":[id],
            "eventNames":[
                "PlayerLogout"
            ]
        }
        window.logoutsocket.send (JSON.stringify(subscription_data));
    }
    else {
        var subscription_data = {
            "service":"event",
            "action":"subscribe",
            "characters":[id],
            "eventNames":[
                "Death",
                "VehicleDestroy",
                "PlayerLogin",
                "PlayerLogout",
                "GainExperience"
            ]
        }
        window.socket.send (JSON.stringify(subscription_data));
    }
}


function add_player_to_list(player) {
    var markup=`
    <div class="control">
        <div class="tags has-addons">
        <a class="tag is-link">${player.name}</a>
        <a data-char_id="${player.char_id}" class="tag is-delete"></a>
        </div>
    </div>
    `
    var html = jQuery('#player_list_wrap').html();
    html += markup;
    jQuery('#player_list_wrap').html(html);
}


// https://census.daybreakgames.com/s:iridar/get/ps2/item?c:lang=en&c:join=item_to_weapon(weapon)
window.onload = function() {
    window.allevents = [];
    window.gainexperienceevents = [];

    jQuery('#playersearch').keyup(function(e){
        var code = e.which;
        if(code==13) {
            e.preventDefault();
            player_search();
            return false;
        }
    });

    jQuery('#playersearch_btn').click(function(e){
        e.preventDefault();
        player_search();
        return false;
    });

    jQuery('#player_list_wrap').on('click','.is-delete', function(e){
        var delete_char_id = jQuery(this).data('char_id');
        console.log('removing:');
        console.log(delete_char_id);
        jQuery(this).closest('div.tags').remove(); 
        for (let i = playerlist.length - 1; i >= 0; i--) {
            if (playerlist[i].char_id == delete_char_id.toString()) {
                playerlist.splice(i, 1);
            }
        }
        localStorage.setItem('ps2_players',JSON.stringify(playerlist));
    });

    jQuery('#playersearchresults').on('click','a',function(e){
        e.preventDefault();
        var char_id = jQuery(this).data('character_id');
        var name = jQuery(this).text();
        var player = {'char_id':char_id, 'name':name};
        add_player_to_list(player);
        subscribe_to_character(char_id);
        get_player_online_state(char_id);
        // save in localstorage
        found_char = {'char_id':char_id,'name':name}
        if (!window.playerlist) {
            window.playerlist = [];
        }
        playerlist.push(found_char);
        var playerlist_json = JSON.stringify(playerlist);
        localStorage.setItem('ps2_players', playerlist_json);
    });

    

    window.socket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax');
    window.logoutsocket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax');


    logoutsocket.onmessage = function(data) {
        if (data.hasOwnProperty('payload')) {
            if (data.payload.event_name!="PlayerLogout") {
                // do ragequit tests/checks etc
                console.log('Logout event');
                console.log(data);
                display_event(data);
            }
        }
    }


    // handle dom changes and monitor unprocessed variables
    
    
    // Handle socket opening
    socket.onopen = function(event) {
        //socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.url;
        //socketStatus.className = 'open';
        // get player ids from localstorage
        window.playerlist.forEach(player => {
            add_player_to_list(player);
            subscribe_to_character(player.char_id);
            get_player_online_state(player.char_id);
        });
    };

    // Handle any errors that occur.
    socket.onerror = function(error) {
        console.log('WebSocket Error: ',error);
        alert('Problem connecting to API - try again later');
    };

    // Handle messages sent by the server.
    socket.onmessage = function(event) {
        var message = event.data;
        var data = JSON.parse(message);
        if (data.hasOwnProperty('payload')) {
            if (data.payload.event_name=="PlayerLogout") {
                set_player_offline (data.payload.character_id);
            }
            if (data.payload.event_name=="PlayerLogin") {
                set_player_online (data.payload.character_id);
            }
            //messagesList.innerHTML += '<hr>';
            //messagesList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
            if (data.payload.event_name!="GainExperience") {
                // don't push exp gain events onto stack - not needed, we can handle global counters in the event processing
                window.allevents.push(data);
            }
            else {
                window.gainexperienceevents.push(data); // push onto experience stack for debugging
            }
            // display event nice, get english names first
            display_event(data);
        }
        else {
            // probably heartbeat or similar, ignore for now
        }
    }
};

// modal stuff

document.querySelector('#show_player_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#playermodal').classList.toggle('is-active');
});

document.querySelector('#show_feedback_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#feedback_modal').classList.toggle('is-active');
});

document.querySelector('#show_about_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#about_modal').classList.toggle('is-active');
});


document.querySelector('#show_export_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#export_modal').classList.toggle('is-active');
    document.getElementById('config_export').select();
    if (document.execCommand('copy')) {
        alert('Current config is in your copy buffer ready to be pasted somewhere!');
    }
});

document.querySelector('#show_achievements_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#achievement_modal').classList.toggle('is-active');
    
});

modal_backgrounds = document.querySelectorAll('.modal-background');
modal_backgrounds.forEach(bg => {
    bg.addEventListener('click',function(e){
        e.preventDefault();
        e.target.closest('.modal').classList.toggle('is-active');
    }); 
});

close_modals = document.querySelectorAll('.modal .delete');
close_modals.forEach(close_modal => {
   close_modal.addEventListener('click',function(e){
        e.preventDefault();
        e.target.closest('.modal').classList.toggle('is-active');
    }); 
});

// gen achi list
list = document.getElementById('achievments_list');
new_achievements.forEach(a => {
    friendly_name = encodeURI(a.id);
    card_footer_markup = '<div class="field is-grouped is-grouped-multiline">';
    
    for (let [index, val] of a.soundfiles.entries()) {
        if (val.startsWith('http')) {
            card_footer_entry = `
                <div class="control">
                    <div class="tags has-addons">
                        <span class="tag">${val}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag is-light is-primary play_sound">></span>
                        <a data-id='${a.id}' data-index='${index}' class="remove-audio tag is-delete is-danger"></a>
                    </div>
                </div>
            `;
        }
        else {
            // built in audio
            card_footer_entry = `
                <div class="control">
                    <div class="tags has-addons">
                        <span class="tag is-light">${val}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag is-light is-primary play_sound">></a>
                        <!--<a data-id='${a.id}' data-index='${index}' class="tag is-light is-info disable_default">on</a>-->
                    </div>
                </div>
            `;
        }
        card_footer_markup += card_footer_entry;
    };
    card_footer_markup += '</div>';
    if (a.enabled) {
        yes_checked='checked'; no_checked='';
    }
    else {
        yes_checked=''; no_checked='checked';
    }
    markup = `
    <div class="card" data-id="${a.id}">
        <header class="card-header">
            <p class="card-header-title">
            ${a.name}
            </p>
            <div class="control">
                <label class="radio ">
                    <input ${yes_checked} value="on" type="radio" class="audio_enabled_radio" name="enabled_${friendly_name}">
                    On
                </label>
                <label class="radio">
                    <input ${no_checked} value="off" type="radio" class="audio_enabled_radio" name="enabled_${friendly_name}">
                    Off
                </label>
            </div>
        </header>
        <div class="card-content">
            <div class="content">
                ${a.description}
                
            </div>
        </div>
        <footer class='card-footer'>
            ${card_footer_markup}
            <button style='margin:1em' class='add_audio button is-small is-light is-success'>+</button>
        </footer>
    </div>
    `;
    list.innerHTML = list.innerHTML + markup;
});



function save_config() {
    // strip name/desc and jsonify into localstorage
    ach_json = JSON.stringify(new_achievements);
    window.temp_config = JSON.parse(ach_json);
    for (n=0;n<temp_config.length;n++) {
        delete temp_config[n].name;
        delete temp_config[n].description;
        delete temp_config[n].sounds;
        delete temp_config[n].priority;
        delete temp_config[n].interruptable;
    }
    final_config_string = JSON.stringify(temp_config);
    localStorage.setItem('ps2_achievements',final_config_string);
}

document.getElementById('apply_config').addEventListener('click',function(e){
    config_string = document.getElementById('config_export').value;
    console.log('Applying:');
    console.log(config_string);
    config = JSON.parse(config_string);
    if (config) {
        // save string and reload config
        localStorage.setItem('ps2_achievments',config_string);
        load_config();
        alert('Sound Pack Loaded');
    }
    else {
        alert('Error applying sound pack!');
    }
});

function load_config() {
    config = JSON.parse(localStorage.getItem('ps2_achievements'));
    if (config) {
        // find achievements in config and match to hard coded
        for (i=0; i<config.length; i++) {
            ach = null;
            for (n=0; n<new_achievements.length; n++) {
                if (new_achievements[n].id==config[i].id) {
                    ach = new_achievements[n];
                    break;
                }
            };
            if (!ach) {
                console.log('No matching achievement found during config load for: ',config[i]);
            }
            else {
                // found config for an achievement
                // loop through sounds and add
                for (x=0; x<config[i].soundfiles.length; x++) {
                    sf = config[i].soundfiles[x];
                    if (sf.startsWith('https')) {
                        ach.soundfiles.push(config[i].soundfiles[x]);
                        s = new Audio(sf);
                        s.crossOrigin = 'anonymous';
                        ach.sounds.push(s); 
                        //console.log('Inserting new audio ',sf,' into ach: ',ach);
                    }
                }
                // set enabled state
                if (config[i].hasOwnProperty('enabled')) {
                    if (config[i].enabled) {
                        ach.enabled=true;
                    }
                    else {
                        ach.enabled=false;
                    }
                }
            }
        }
    }
    config_textarea = document.getElementById('config_export');
    config_textarea.innerText = JSON.stringify(config);
}

function get_achievement(id) {
    for (n=0; n<new_achievements.length; n++) {
        if (new_achievements[n].id==id) {
            return new_achievements[n];
        }
    }
    return null;
}

document.querySelector('#volume').addEventListener('change',function(e){
    volume = e.target.value;
    console.log('volume is now ',volume);
    localStorage.setItem('ps2_volume',volume);
    new_achievements.forEach(achievement => {
        achievement.sounds.forEach(sound => {
            sound.volume = volume/100;
        });
    });
});
saved_volume = localStorage.getItem('ps2_volume');
if (saved_volume) {
    volume_slider = document.querySelector('#volume')
    volume_slider.value = saved_volume;
    volume_slider.dispatchEvent(new Event('change'));
}

document.querySelector('body').addEventListener('click',function(e){

    //console.log(e.target);

    if (e.target.classList.contains('audio_enabled_radio')) {
        var val=null;
        var name = e.target.name;
        var all_radios = document.getElementsByName(name);
        for(i = 0; i < all_radios.length; i++) { 
            if(all_radios[i].checked) 
            val = all_radios[i].value;
        }
        ach_id = e.target.closest('.card').dataset.id;
        //console.log(ach_id);
        ach = get_achievement(ach_id);
        if (val=='on') {
            ach.enabled=true;
        }
        else {
            ach.enabled=false;
        }
        save_config();
    }

    if (e.target.classList.contains('is-delete') && e.target.classList.contains('remove-audio')) {
        resp = confirm('Are you sure?');
        if (resp) {
            // data-id='${a.id}' data-index='${index}'
            id = e.target.dataset.id;
            index = e.target.dataset.index;
            console.log('removing audio id',id,' index ',index);
            ach = get_achievement(id);
            ach.sounds.splice(index,1);
            ach.soundfiles.splice(index,1);
            save_config();
            e.target.closest('.control').remove();
        }
    }

    if (e.target.classList.contains('play_sound')) {
        // data-id='${a.id}' data-index='${index}'
        id = e.target.dataset.id;
        index = e.target.dataset.index;
        console.log('playing audio id',id,' index ',index);
        ach = get_achievement(id);
        ach.sounds[index].play();
    }
    
    if (e.target.classList.contains('add_audio')) {
        card = e.target.closest('.card');
        achievement_id = card.dataset.id;
        //alert(achievement_id);
        url = prompt('Enter full URL of mp3/ogg file:');
        if (url!==""&&url!==null) {
            if (!url.startsWith('https')) {
                alert('Needs to be the full URL, and needs to be HTTPS');
            }
            else {
                ach = null;
                for (n=0; n<new_achievements.length; n++) {
                    if (new_achievements[n].id==achievement_id) {
                        ach = new_achievements[n];
                        break;
                    }
                };
                if (!ach) {
                    alert('No matching achievement found');
                }
                else {
                    console.log('Inserting new audio into ach: ',ach);
                    ach.soundfiles.push(url);
                    s = new Audio(url);
                    s.crossOrigin = 'anonymous';
                    ach.sounds.push(s);
                    save_config();
                    index = ach.sounds.length-1;
                    id = ach.id;
                    // update row of entries in card
                    card_footer_entry = `
                        <div class="control">
                            <div class="tags has-addons">
                                <span class="tag">${url}</span>
                                <a data-id='${id}' data-index='${index}' class="tag is-light is-primary play_sound">></span>
                                <a data-id='${id}' data-index='${index}' class="remove-audio tag is-delete is-danger"></a>
                            </div>
                        </div>
                    `;
                    html = card.querySelector('.is-grouped').innerHTML;
                    html += card_footer_entry;
                    card.querySelector('.is-grouped').innerHTML = html;
                }
            }
        }
    }
})

