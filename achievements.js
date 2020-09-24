
window.new_achievements = [];


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
            
            var destroyed_vehicle = get_local_vehicle(event.payload.vehicle_id);
            console.log(event);
            console.log('checking if you destroyed a light aircraft:');
            console.log(destroyed_vehicle);
            if (destroyed_vehicle) {
                if (destroyed_vehicle.type_name=="Light Aircraft") {
                    return true;
                }
            }
        }
    }
    return false;
},['land_your_plane.mp3','crash_and_burn_mav.mp3','keep-the-skies-clear.mp3','flying_dying.mp3'],10);

var topgun = new Achievement('topgun','Top Gun!','Destroyed an ESF with an ESF!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (is_player(event.payload.attacker_character_id) && !is_player(event.payload.character_id)) {
            // killed a vehicle, not your own
            if (!tk(event)) {
                // ...or a friendly vehicle
                if (is_esf(event.payload.vehicle_id) && is_esf(event.payload.attacker_vehicle_id)) {
                    // killed an esf while in your esf
                    return true;
                }
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
var ludicrous = new Achievement('ludicrous','Ludicrous Kill!','8 kills in quick succession!', function (event) {
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
    if (event.payload.character_loadout_id=='1' || event.payload.character_loadout_id=='8' || event.payload.character_loadout_id=='15'|| event.payload.character_loadout_id=='22') {
        // 1,8.15,190 = infil loadouts - 190 = ns - could be 15+7
        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
        return true;
    }
},['Low Profile.ogg','invisibleman.mp3'],20);


var max_kill = new Achievement('minmax','Min Max!','You killed a tiny brain person in a really big suit!', function (event) {
    if (!is_kill(event)) {
        return false;
    }
    if (tk(event)) {
        return false;
    }
    if (event.payload.character_loadout_id=='7' || event.payload.character_loadout_id=='14' || event.payload.character_loadout_id=='21'|| event.payload.character_loadout_id=='33') {
        // max loadouts - THINK 33 is ns max, not 100% sure - could be 28
        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
        return true;
    }
},['max-here-boy.mp3','embarass-max.mp3'],20);

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
            vh = get_local_vehicle(event.payload.vehicle_id);
            if (vh) {
                if (vh.name.en=="Harasser") {
                    return (true);
                }
            }
        }
    }
    return false;
},['VOLUME_Dude wheres my car.wav'],20);

var killed_by_shotgun = new Achievement('redmist','Red Mist!','You got killed by a shotgun!', function (event) {
    
    if (!is_kill(event) && event.payload.event_name=="Death") {
        if (event.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Shotgun") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
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

var spraypray = new Achievement('spraypray','Spray & Pray!','You killed 5 people in a row with body shots!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (window.bodyshotkillstreak>0 && window.bodyshotkillstreak%5==0) {
            return true;
        }
    }
    return false;
},["that's-not-entirely-accurate.mp3"],5);

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
            var msg = "You blinded the enemy!";
            //msg += print_character(event.payload.other_id);
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
            //console.log(event);
            //console.log ('Triggered bomb disposal:');
            var msg = "You defused the situation!";
            //msg += print_character(event.payload.other_id);
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

var tk_sound = new Achievement('badteamkill','Blue on blue!','You were killed by a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (!is_kill(event) && tk(event)) {
            return true;
        }
    }
    return false;
},['To a Zone... one of Danger.ogg']);

var welcome = new Achievement('welcome','Welcome To Planetside!','You killed someone new to the game!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event)) {
            if (!characters[event.payload.character_id].hasOwnProperty('character_list')) {
                console.log ('Character ', character_id, ' has no character list array');
                return '[unknown]';
            }
            if (characters[event.payload.character_id].character_list.length==0) {
                console.log ('Character ', character_id, ' has empty character list array');
                return '[unknown]';
            }
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
            if (stats_history) {
                victim_kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            }
            else {
                victim_kdr = 0;
            }
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
                console.log('you killed - mutual test - same timestamp for ',event, ' and ',prev);
                // same time
                if (prev.payload.event_name=="Death" && is_player (prev.payload.character_id)) {
                    // you died prev
                    if (prev.payload.attacker_character_id==event.payload.character_id) {
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
                console.log('you died - mutual test - same timestamp for ',event, ' and ',prev);
                // same time
                if (prev.payload.event_name=="Death" && is_player (prev.payload.attacker_character_id)) {
                    // you killed in prev
                    if (!tk(prev)) {
                        if (prev.payload.character_id==event.payload.attacker_character_id) {
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