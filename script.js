var playerlist = JSON.parse(localStorage.getItem('ps2_players'));




var killstreak=0; // reset by death
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
var weapons={}; 
var vehicles={};
var synth = window.speechSynthesis;
var achievements = {};
var new_achievements = [];
var cur_achievements = []; // per event stack of triggered achievements - sorted by 



function insert_row (data, msg) {         
    var events_table = document.getElementById('events');
    var cls='';
    var msg='';
    var pills='';

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
}

function Achievement(name, description, trigger, sounds=['ting.mp3'], priority=10, interruptable=false) {
    this.name = name;
    this.description = description;
    this.sounds = sounds;
    this.priority=priority;
    this.interruptable = interruptable;
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
    random_sound_index = Math.floor(Math.random() * this.sounds.length);
    this.sounds[random_sound_index].play();
};

// define achievments
var revenge = new Achievement('Revenge!','Killed someone who killed you before!', function (event) {
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
},['Sorry, I was laughing at your Name.ogg']);

var decikills = new Achievement('DecaKill!','10 unanswered kills in a row!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (killstreak%10==0 && killstreak>9) {
            return (true);
        }
    }
    return false;
},['No One Could have Survived.ogg'],5);



var sneaker_kill = new Achievement('Sneaker!','You killed an invisible pussy!', function (event) {
    if (!is_kill(event)) {
        return false;
    }
    if (tk(event)) {
        return false;
    }
    if (event.payload.character_loadout_id=='1' || event.payload.character_loadout_id=='8' || event.payload.character_loadout_id=='15') {
        // 1,8.15 = infil loadouts
        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
        return true;
    }
},['Low Profile.ogg']);

var headshot_ach = new Achievement('Headshot!','You got a headshot kill!', function (event) {
    if (is_kill(event) && !tk(event)) {
        if (event.payload.is_headshot=='1') {
            return (true);
        }
    }
    return false;
},['ting.mp3'],20);

var killed_by_shotgun = new Achievement('Red Mist!','You got killed by a shotgun!', function (event) {
    if (!is_kill(event) && event.payload.event_name=="Death") {
        if (weapons[event.payload.attacker_weapon_id].item_list[0].item_category_id_join_item_category.name.en=='Shotgun') {
            return (true);
        }
    }
    return false;
},['rudeness.mp3','bus-driver-crap.mp3']);

var reviver = new Achievement('Revive!','You revived someone!', function (event) {
    if (event.payload.event_name=="GainExperience" && is_player(event.payload.character_id)) {
        // 7 = revive, 57 = squad revive
        if (event.payload.experience_id=='7' || event.payload.experience_id=='57' ) {
            window.revive_count_streak++;
            console.log ('Triggered revive:');
            return true;
        }
    }
    return false;
},['Bwup!.ogg'],['To a Zone... one of Danger.ogg'],20);

var repeat = new Achievement('Repeat Customer!','You killed the same person multiple times!', function (event) {
    var l = window.allevents.length;
    if (l<2) {
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

var assister = new Achievement('Santas Little Helper!','You assisted killing someone 5 times in a row without killing anybody yourself!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 2 assist, 371 priority assist
        if (event.payload.experience_id=='2' || event.payload.experience_id=='371') {
            assist_streak++;
            if (assist_streak>=5) {
                assist_streak=0;
                var msg = "You are Santa's Little Helper! 5 assists in a row without any kills yourself!";
                //msg += print_character(event.character_id);
                insert_row (event, msg);
                return true;
            }
        }
    }
    return false;
},['helper.mp3'],5);

var blinder = new Achievement('Stevie Wonder Creator!','You blinded someone by killing their motion spotter!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 293 motion detect, 370 kill motion spotter, 294 squad motion detect
        if ( (event.payload.experience_id=='370')) {
            console.log ('Triggered stevie wonder:');
            var msg = "You blinded ";
            msg += print_character(event.character_id);
            insert_row (event, msg);
            return true;
        }
    }
    return false;
},['Noop.ogg']);

var tk_sound = new Achievement('Teamkill!','You killed a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && tk(event)) {
            return true;
        }
    }
    return false;
},['My Bad! Thats on me.ogg']);

var welcome = new Achievement('Welcome To Planetside!','You killed someone new to the game!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event)) {
            if (characters[event.payload.character_id].character_list[0].battle_rank.value < 6) {
                return true;
            }
        }
    }
    return false;
},['Prospective Investor.ogg']);


var welcome = new Achievement('Shitter Dunk!','You killed someone with a good KDR!', function (event) {
    if (event.payload.event_name=="Death") {
        if (is_kill(event) && !tk(event)) {
            stats_history = characters[event.payload.character_id].character_list[0].stats.stat_history;
            victim_kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            if (victim_kdr>2) {
                return true;
            }
        }
    }
    return false;
},['fanofcock.ogg', 'Just Pout.ogg','PAM - yeehhh, sploosh.ogg'],6);

// end of define achievments

// replace sound filenames in achievements with actual audio elements
new_achievements.forEach(achievement => {
    if (achievement.hasOwnProperty('sounds')) {
        for (n=0; n<achievement.sounds.length; n++) {
            achievement.sounds[n] = new Audio('https://bobmitch.com/ps2/audio/' + achievement.sounds[n]);
            achievement.sounds[n].crossOrigin = 'anonymous';
        }
    }
});

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
    var attacker_id=event.payload.attacker_character_id;
    var victim_id=event.payload.character_id;
    //console.log('checking for tk between:',attacker_id,' and ',victim_id);
    if (window.characters[attacker_id]===undefined || window.characters[victim_id]===undefined) {
        return false;
    }
    if (window.characters[attacker_id].character_list[0].faction_id==window.characters[victim_id].character_list[0].faction_id) {
        return true;
    }
    else {
        return false;
    }
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
    jQuery.when(get_vehicle(data.payload.vehicle_id),get_vehicle(data.payload.attacker_vehicle_id),get_character(data.payload.character_id), get_character(other_id), get_character(data.payload.attacker_character_id), get_weapon(data.payload.attacker_weapon_id) ).then(function(){
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
            else if ( (data.payload.experience_id=='370' || data.payload.experience_id=='293' || data.payload.experience_id=='294') && data.payload.character_id==window.char_id) {
                console.log('motion sensor kill');
                motion_sensor_kills++;
            }
        }		
        if (data.payload.event_name=='Death') {

            //console.log ('Comparing ' + data.payload.attacker_character_id + ' to ' + window.char);
            if (is_player(data.payload.attacker_character_id)) {
                msg+='You killed ';
                if (data.payload.character_id==window.char) {
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
                        msg+= ' <span>'+weapons[data.payload.attacker_weapon_id].item_list[0].name.en+' <span class="weapon_type">('+weapons[data.payload.attacker_weapon_id].item_list[0].item_category_id_join_item_category.name.en+')</span></span> ';
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
                    msg+= ' using <span>'+weapons[data.payload.attacker_weapon_id].item_list[0].name.en+'</span> <span class="weapon_type"> ('+weapons[data.payload.attacker_weapon_id].item_list[0].item_category_id_join_item_category.name.en+')</span> ';
                }
                else {
                    msg+=' with nothing at all!';
                }
            }
            if (data.payload.attacker_vehicle_id!="0") {
                //msg+= ' <span class="pill">Vehicle: ' + vehicles[data.payload.attacker_vehicle_id].vehicle_list[0].name.en + '</span>';
                console.log(vehicles[data.payload.attacker_vehicle_id])
            }
        }
        if (data.payload.event_name=='VehicleDestroy') {
            if (data.payload.character_id==window.char) {
                msg+='Your <span>'+vehicles[data.payload.vehicle_id].item_list[0].name.en+'</span> was destroyed by ';
                msg+=print_character(data.payload.attacker_character_id);
            }
            else {
                msg+='You destroyed a <span>'+vehicles[data.payload.vehicle_id].vehicle_list[0].name.en+'</span> with ';
                
                if (data.payload.attacker_weapon_id!="0") {
                    msg+= ' using <span>'+weapons[data.payload.attacker_weapon_id].item_list[0].name.en+'</span> <span class="weapon_type">('+weapons[data.payload.attacker_weapon_id].item_list[0].item_category_id_join_item_category.name.en+')</span> ';
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
        return window.characters[character_id];
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
    if (1==0) {
        // have local
        return weapon;
    }
    else {
        // handle as promise
        var dfd = jQuery.Deferred();
        //https://census.daybreakgames.com/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&weapon_id=1
        //var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&item_id=" + weapon_id + '&callback=?';
        var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/item?c:lang=en&c:join=item_category&c:join=item_to_weapon(weapon)&c:limit=1&item_id=" + weapon_id + '&callback=?';
        //console.log('Getting char info from census for ' + character_id);
        jQuery.getJSON(url,function(json){
            var weapon = json;
            //console.log('got weapon:');
            //console.log(weapon);
            window.weapons[weapon_id] = weapon;
            dfd.resolve(weapon);
        });
        return dfd.promise();
    }
        
}

function get_vehicle (vehicle_id) {
    // check if weapon_id already in local cache
    // no local, so need to get then update
    if (1==0) {
        // have local
        return vehicle;
    }
    else {
        // handle as promise
        var dfd = jQuery.Deferred();
        //https://census.daybreakgames.com/get/ps2:v2/item?c:lang=en&c:join=item_to_weapon(weapon)&c:limit=1&weapon_id=1
        var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/vehicle?c:limit=1&vehicle_id=" + vehicle_id + '&callback=?';
        //console.log('Getting char info from census for ' + character_id);
        jQuery.getJSON(url,function(json){
            var vehicle = json;
            //console.log('got weapon:');
            //console.log(vehicle);
            window.vehicles[vehicle_id] = vehicle;
            dfd.resolve(vehicle);
        });
        return dfd.promise();
    }
        
}

function player_search(){
    var playername=jQuery('#playersearch').val();
    //var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:join=characters_online_status&name.first_lower=%5E" + playername + "&c:limit=10&c:sort=name.first_lower&callback=?";
    var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:resolve=online_status&name.first_lower=%5E" + playername + "&c:limit=10&c:sort=name.first_lower&callback=?";
    jQuery('#playersearchresults').html('<p>Searching...</p>');
    jQuery.getJSON(url,function(json){
        var search = json;
        console.log(search);
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

function update_character_display(character_id) {

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

function process_event(event) {
    
    if (event.payload.event_name=="PlayerLogin") {
        say('Player logged in');
    }
    if (event.payload.event_name=="PlayerLogout") {
        say('Player logged out');
    }
    // update global values based on event
    if (event.payload.event_name=='Death') {
        if (is_player(event.payload.character_id)) {
            // you died
            window.killstreak=0;
        }
        else {
            if (!tk(event)) {
                // genuine kill
                window.killstreak++;
                assist_streak=0; // end assist streak
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
        // sort by priority
        // and trigger top
        window.cur_achievements.sort((a, b) => (a.priority > b.priority) ? 1 : -1)
        if (window.cur_achievements.length>0) {
            window.cur_achievements[0].trigger();
        }
    });

    auto_updaters = document.querySelectorAll('.autoupdate');
    auto_updaters.forEach(auto => {
        variable = auto.dataset.variable;
        value = window[variable];
        auto.innerText = value;
    });
    
}

function subscribe_to_character_logout(id) {
    // todo - monitor for rage quits
    subscribe_to_character(id,true);
}

function subscribe_to_character(id, logoutonly=false) {

    // clear existing subscription
    var subscription_data = {
        "action":"clearSubscribe",
        "all":"true",
        "service":"event"
    }
    window.socket.send (JSON.stringify(subscription_data));
    
    // subscribe to new char events
    if (logoutonly) {
        var subscription_data = {
            "service":"event",
            "action":"subscribe",
            "characters":[id],
            "eventNames":[
                "PlayerLogout"
            ]
        }
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
    }
    window.socket.send (JSON.stringify(subscription_data));

    // check if online
    url = "https://census.daybreakgames.com/s:bax/get/ps2:v2/character?c:join=characters_online_status(character_id)&character_id=" + id;
    //url = "https://census.daybreakgames.com/s:bax/get/ps2:v2/character?c:join=characters_online_status(character_id)&character_id=" + window.char;
    jQuery.getJSON(url,function(json){
        console.log('Subscribed to player char:');
        console.log(json);
        //say('Subscribed to ' + json.character_list[0].name.first,'subscribed');
        var status=json;
        if (status.character_list[0].character_id_join_characters_online_status.online_status!="0") {
            jQuery('#online_status').text('Online');
        }
        jQuery('#playername').text(status.character_list[0].name.first);
    });
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
    
    var messagesList = document.getElementById('messages');
    var socketStatus = document.getElementById('status');

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
        // save in localstorage
        found_char = {'char_id':char_id,'name':name}
        if (!playerlist) {
            playerlist = [];
        }
        playerlist.push(found_char);
        var playerlist_json = JSON.stringify(playerlist);
        localStorage.setItem('ps2_players', playerlist_json);
    });

    

    window.socket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax');


    


    // handle dom changes and monitor unprocessed variables
    
    
    // Handle socket opening
    socket.onopen = function(event) {
        //socketStatus.innerHTML = 'Connected to: ' + event.currentTarget.url;
        //socketStatus.className = 'open';
        // get player ids from localstorage
        playerlist.forEach(player => {
            add_player_to_list(player);
            subscribe_to_character(player.char_id);
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
            //messagesList.innerHTML += '<hr>';
            //messagesList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
            if (data.payload.event_name!="GainExperience") {
                // don't push exp gain events onto stack - not needed, we can handle global counters in the event processing
                window.allevents.push(data);
            }
            if (data.payload.event_name=='Death') {
                //console.log(data);
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
    friendly_name = encodeURI(a.name);
    markup = `
    <div class="card">
  <header class="card-header">
    <p class="card-header-title">
    ${a.name}
    </p>
    <div class="control">
        <label class="radio">
            <input checked type="radio" name="enabled_${friendly_name}">
            Yes
        </label>
        <label class="radio">
            <input type="radio" name="enabled_${friendly_name}">
            No
        </label>
    </div>
  </header>
  <div class="card-content">
    <div class="content">
        ${a.description}
    </div>
  </div>
</div>
    `;
    list.innerHTML = list.innerHTML + markup;
});