


// load options

var playerlist = JSON.parse(localStorage.getItem('ps2_players'));
if (playerlist===null) {
    playerlist = [];
}
var ps2_extraaudio = JSON.parse(localStorage.getItem('ps2_extraaudio'));
if (ps2_extraaudio===null) {
    ps2_extraaudio = [];
}

test_audio = new Audio('audio/ting.mp3');
window.mute_test = false;

// setup global vars
var event_counter = 0;
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
    volume = document.querySelector('#volume').value;
    utterThis.volume = volume/100.0;
    window.synth.speak(utterThis);
}

function nice_date(timestamp) {
    var date = new Date(timestamp*1000);
    //var iso = date.toISOString().match(/(\d{4}\-\d{2}\-\d{2})T(\d{2}:\d{2}:\d{2})/);
    //return (iso[1] + ' ' + iso[2]);
    return date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}

function print_character(character_id, event) {
    character = get_local_character(character_id);
    char = '';
    loadout_id = null;
    if (!character) {
        char = '[UNKNOWN]';
        // todo: check if looks like valid character_id
        // and run get_character on it for future events to work
    }
    else {
        // got character - now match up event loadout with character if possible
        // and then get profile
        console.log('Printing character ',character,' for event ',event.payload);
        if (event.payload.event_name=="GainExperience") {
            if (character_id==event.payload.character_id) {
                loadout_id = event.payload.loadout_id;
            }
            else  {
                // no loadout for other_id
                loadout_id = null;
            }
        }
        else if (event.payload.event_name=="Death"||event.payload.event_name=="VehicleDestroy") {
            if (character_id==event.payload.attacker_character_id) {
                loadout_id = event.payload.attacker_loadout_id;
            }
            else {
                loadout_id = event.payload.character_loadout_id;
            }
        }
        loadout = get_loadout(loadout_id);
        profile_name = '';
        if (loadout) {
            profile = get_profile (loadout.profile_id);
            if (profile) {
                profile_name = profile.description.en;
            }
            else {
                console.log('Unknown profile for loadout for loadout: ',loadout,' in event ',event);
            }
        }
        else {
            console.log('Unknown loadout for event char loadout: ',event);
        }
        char+="<span class='"+profile_name+"'>" + profile_name + "</span>";
        char+='<span class="char faction'+character.faction_id+'"> ';
            char+='<span class="charname">';
            if (character.hasOwnProperty('outfit')) {
                char+='<span class="outfit">'+characters[character_id].character_list[0].outfit.alias+'</span>&nbsp;';
            }
            char+= character.name.first+'</span> ';
            char+='<span class="br">BR:'+character.battle_rank.value+'</span> ';
            //char+='</span>';

            stats_history = character.stats.stat_history;
            if (stats_history) {
                kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            }
            else {
                kdr = "?";
            }
            char+='<span class="br kdr">KDR: ' + kdr + '</span>'
        char+='</span>';
    }
    return char;
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
            // do messages for none-displayed achievements
            if ( (data.payload.experience_id=='7' || data.payload.experience_id=='57') && is_player(data.payload.character_id)) {
                msg+='You revived ';
                cls+=' info ';
                msg+=print_character(data.payload.other_id, data);
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
                    if (is_tk(data)) {
                        msg = "You teamkilled "
                        cls+=' tk ';
                    }
                    cls+=' kill ';
                    msg+= print_character(data.payload.character_id, data);
                    if (data.payload.is_headshot=="1") {
                        cls+=' headshot ';
                        //pills+='<span class="tag is-dark">headshot</span> '; // should be populated by achievement tag
                    }
                    // get weapon
                    if (data.payload.attacker_weapon_id!="0") {
                        msg += display_weapon_and_type(data.payload.attacker_weapon_id);
                    }
                    else if (data.payload.attacker_vehicle_id!='0') {
                        // maybe got squished
                        vehicle_name = get_vehicle_name(data.payload.attacker_vehicle_id);
                        msg+= ' with your ' + vehicle_name + '</span>';
                    }
                    else {
                        msg+= ' using just your mind!</span> ';
                    }
                }
            }
            else {
            
                cls+=' death ';
                
                if (is_tk(data)) {
                    msg += "You were teamkilled by "
                    cls+=' tk ';
                }
                else {
                    msg += 'You were killed by ';
                }
                msg+=print_character(data.payload.attacker_character_id, data);
                // get weapon
                if (data.payload.attacker_weapon_id!='0') {
                    msg += display_weapon_and_type(data.payload.attacker_weapon_id);
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
                vehicle_name = get_vehicle_name(data.payload.vehicle_id);
                if (vehicle_name) {
                    msg+='Your <span>'+vehicle_name+'</span> was destroyed by ';
                }
                else {
                    msg+='Your <span>[unknown]</span> was destroyed by ';
                }
                msg+=print_character(data.payload.attacker_character_id, data);
            }
            else {
                msg+='You destroyed ';
                vehicle_name = get_vehicle_name(data.payload.vehicle_id);
                if (data.payload.character_id=="0") {
                    msg += " a " +vehicle_name+'</span> ';
                }
                else {
                    msg+=print_character(data.payload.character_id, data);
                    msg+="'s<span> "+vehicle_name+'</span> ';
                }
                
                
                
                if (data.payload.attacker_weapon_id!="0") {
                    msg += display_weapon_and_type(data.payload.attacker_weapon_id);
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

        // TK debug / loadout debug
        /* var attacker_loadout_id=event.payload.attacker_loadout_id;
        var victim_loadout_id=event.payload.character_loadout_id;
        console.log('new tk event test');
        console.log(event);
        console.log(attacker_loadout_id);
        console.log(victim_loadout_id);
        // loadout 31 = profile 193 - 4th fac engie */
        // END TK DEBUG

        if (is_player(event.payload.character_id)) {
            // you died
            window.killstreak=0;
            window.spamstreak=0;
            multikills=0;
            window.deaths++;
            update_kd();
        }
        else {
            if (!is_tk(event)) {
                // genuine kill
                window.killstreak++;
                if (event.payload.is_headhot=="0") {
                    window.bodyshotkillstreak++;
                }
                else {
                    window.bodyshotkillstreak=0;
                }
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
        data.event_id = event_counter;
        event_counter++;
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

document.querySelector('#show_help_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#help_modal').classList.toggle('is-active');
});


document.querySelector('#show_export_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#export_modal').classList.toggle('is-active');
    
});

document.querySelector('#show_achievements_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#achievement_modal').classList.toggle('is-active');
    
});

document.querySelector('#add_custom_trigger').addEventListener('click',function(e){
    e.preventDefault();
    window.edit_custom_trigger_id = null;
    slim_select.set(''); // reset select 
    // reset form
    document.getElementById('custom_trigger_name').value='';
    document.getElementById('custom_trigger_description').value='';
    document.getElementById('custom_trigger_weapon_id').value='';
    document.querySelector('#custom_trigger_modal').classList.toggle('is-active');
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
render_all_achievement_cards();


// handle new custom trigger submit
document.getElementById('custom_trigger_form').addEventListener('submit',function(e){
    e.preventDefault();
    // create new / edit existin custom trigger, add markup to manage audio dialog and save
    label = document.getElementById('custom_trigger_name').value;
    id = label.toLowerCase().replace(/\s/g, '');
    description = document.getElementById('custom_trigger_description').value;
    onkill = document.querySelector('input[name="onkill"]:checked').value;
    weapon_id = document.getElementById('custom_trigger_weapon_id').value;
    ach_with_same_id = get_achievement(id);
    edit_ach = get_achievement(edit_custom_trigger_id);
    if (ach_with_same_id || edit_ach) {
        save = confirm('This will overwrite an existing custom trigger - as you sure?');
        if (save) {
            edit_ach.id = id;
            edit_ach.description = description;
            edit_ach.name = label;
            edit_ach.onkill = onkill;
            edit_ach.custom_weapon_trigger = weapon_id;
        }
    }
    else {
        // no existing or not editing a current ach
        foo = new Achievement(id, label, description, function (event) {
            if (event.payload.event_name=='Death') {
                //console.log ('checking ',event,' for trigger: ',this);
                if (is_kill(event) && this.onkill=="1") {
                    if (!is_tk(event)) {
                        if (event.payload.attacker_weapon_id==this.custom_weapon_trigger) {
                            return true;
                        }
                    }
                }
                if (is_death(event) && this.onkill=="0") {
                    if (!is_tk(event)) {
                        if (event.payload.attacker_weapon_id==this.custom_weapon_trigger) {
                            return true;
                        }
                    }
                }
            } 
            return false;
        },[],15);
        foo.custom_weapon_trigger = weapon_id;
        foo.onkill=onkill;
        //new_achievements.push(foo); // not needed, new object adds itself to new_achievement object
        console.log('Added new custom weapon trigger: ',foo);
    }
    document.getElementById('custom_trigger_modal').classList.toggle('is-active');
    render_all_achievement_cards(); // redraw all
    save_config();
    return false;
});

document.getElementById('copy_config').addEventListener('click',function(e){
    e.preventDefault();
    document.getElementById('config_export').select();
    if (document.execCommand('copy')) {
        alert('Current config is in your copy buffer ready to be pasted somewhere!');
    }
});


function save_config() {
    // strip name/desc and jsonify into localstorage
    ach_json = JSON.stringify(new_achievements);
    window.temp_config = JSON.parse(ach_json);
    /* for (n=0;n<temp_config.length;n++) {
        if (!temp_config[n].custom_weapon_trigger) {
            delete temp_config[n].name;
            delete temp_config[n].description;
            delete temp_config[n].sounds;
            delete temp_config[n].priority;
            delete temp_config[n].interruptable;
        }
    } */
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
                if (config[i].custom_weapon_trigger) {
                    console.log('Found custom weapon trigger: ',config[i]);
                    // create new custom achievement object based on config
                    foo = new Achievement(config[i].id, config[i].name, config[i].description, function (event) {
                        if (event.payload.event_name=='Death') {
                            //console.log ('checking ',event,' for trigger: ',this);
                            if (is_kill(event) && this.onkill=="1") {
                                if (!is_tk(event)) {
                                    if (event.payload.attacker_weapon_id==this.custom_weapon_trigger) {
                                        return true;
                                    }
                                }
                            }
                            if (is_death(event) && this.onkill=="0") {
                                if (!is_tk(event)) {
                                    if (event.payload.attacker_weapon_id==this.custom_weapon_trigger) {
                                        return true;
                                    }
                                }
                            }
                        } 
                        return false;
                    },[],15);
                    foo.custom_weapon_trigger = config[i].custom_weapon_trigger;
                    foo.onkill=config[i].onkill;
                    ach=foo;
                    console.log('Added custom trigger ',foo);
                }
            }
            if (ach) {
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
            else {
                console.log('No matching achievement found during config load for: ',config[i]);
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
    test_audio.volume = volume/100;
    if (!window.mute_test) {
        test_audio.pause();
        test_audio.currentTime = 0;
        test_audio.play();
    }
    window.mute_test = false;
});
saved_volume = localStorage.getItem('ps2_volume');
if (saved_volume) {
    volume_slider = document.querySelector('#volume')
    volume_slider.value = saved_volume;
    window.mute_test = true;
    volume_slider.dispatchEvent(new Event('change')); 
}
else {
    saved_volume = 100;
}

// hamburger

// Get all "navbar-burger" elements
const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

// Check if there are any navbar burgers
if ($navbarBurgers.length > 0) {

  // Add a click event on each of them
  $navbarBurgers.forEach( el => {
    el.addEventListener('click', () => {

      // Get the target from the "data-target" attribute
      const target = el.dataset.target;
      const $target = document.getElementById(target);

      // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');

    });
  });
}

$(".navbar-item.has-dropdown").click(function(e) {
    if ($(".navbar-burger").is(':visible')) {
      $(this).toggleClass("is-active");
    }
});
$(".navbar-item > .navbar-link").click(function(e) {
    if ($(".navbar-burger").is(':visible')) {
      e.preventDefault();
    }
});
$(window).resize(function(e) {
  if (!$(".navbar-burger").is(':visible') && $(".navbar-item.has-dropdown.is-active").length) {
    $(".navbar-item.has-dropdown.is-active").removeClass('is-active');
  }
});

// live click events

document.querySelector('body').addEventListener('click',function(e){

    // delete custom
    if (e.target.classList.contains('delete_custom')) {
        sure = confirm('Are you sure you wish to delete this custom trigger?');
        if (sure) {
            card = e.target.closest('.card');
            ach_id = card.dataset.id;
            ach = get_achievement(ach_id);
            console.log('Deleting custom: ',ach);
            if (ach) {
                index = get_achievment_index(ach_id);
                if (index) {
                    new_achievements.splice(index,1);
                    render_all_achievement_cards();
                    save_config();
                }
                else {
                    console.log('Unknown achievement clicked for removal: ',ach_id);
                }
            }
            else {
                console.log('Unknown achievement clicked for removal: ',ach_id);
            }
        }
    }

    if (e.target.classList.contains('edit_custom')) {
        // click edit on custom
        card = e.target.closest('.card');
        ach_id = card.dataset.id;
        ach = get_achievement(ach_id);
        if (ach) {
            console.log('editing achievement: ',ach);
            document.getElementById('custom_trigger_name').value = ach.name;
            document.getElementById('custom_trigger_description').value = ach.description;
            document.getElementById('custom_trigger_weapon_id').value = ach.custom_weapon_trigger;
            if (ach.onkill=='1') {
                document.getElementById('onkill').checked = true;
            }
            else {
                document.getElementById('ondeath').checked = true;
            }
            // set current id editing and show modal form
            window.edit_custom_trigger_id = ach_id; // set edit id
            slim_select.set(ach.custom_weapon_trigger); // set select value
            document.querySelector('#custom_trigger_modal').classList.toggle('is-active');
        }
        else {
            console.log('Unknown achievement clicked: ',ach_id);
        }
    }

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
        resp = confirm('Are you sure you wish to delete the custom audio file?');
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
        //console.log('playing audio id',id,' index ',index);
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
                    filename = url.split('/').pop();
                    // update row of entries in card
                    card_footer_entry = `
                        <div class="control">
                            <div class="tags has-addons">
                                <span data-tooltip="${url}" title='${url}' class="tag">${filename}</span>
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

