
// fisu stats
window._worldId = 1; // connery 1
window.zone_id = null;
window._environment=0;

window.addEventListener('load', function () {
    document.body.classList.remove('loading');
    if (window.hasOwnProperty('obsstudio')) {
        // hide splash in obs once loaded
        splash = document.getElementById('splash');
        splash.parentNode.removeChild(splash);
    }
})

// update k/s every 10 seconds

setInterval(function(){
    
    if (window.hasOwnProperty('session_start_time')) {
        var curtime = Math.floor((new Date()).getTime() / 1000);
        var time_since_session_start = curtime - window.session_start_time;
        //console.log('curtime: ',curtime);
        //console.log('session start time: ',window.session_start_time);
        if (time_since_session_start>0) {
            //console.log('updating kpm');
            //console.log('time since session start: ',time_since_session_start);
            window.kpm = (window.kills / (time_since_session_start/60)).toFixed(2);
            update_stats();
        }
    }
}, 10000);

// window.obsstudio property available if within OBS

if (window.hasOwnProperty('obsstudio')) {
    // do whatever is needed!
    //alert('obs');
    document.getElementsByTagName('body')[0].classList.add('obs');
    document.getElementsByTagName('html')[0].classList.add('isobs');
    document.getElementsByTagName('body')[0].classList.add('obshost');
}
else {
    document.getElementsByTagName('body')[0].classList.add('testobs');
}

// other funct

var changeRule = function(selector, property, value) {
    var styles = document.styleSheets, n, sheet, rules, m, done = false;
    selector = selector.toLowerCase();
    for(n = 0; n < styles.length; n++) {
        if (styles[n].href !== null) {
            if (!styles[n].href.includes('bobmitch')) {
                continue;
            }
        }
        console.log('got bobmitch stylesheet... checking...');
        sheet = styles[n];   
        rules = sheet.cssRules; // sheet.rules is deprecated IE8 only
        for(m = 0; m < rules.length; m++) {
            //console.log('checking rule ', rules[m]);
            if (rules[m].selectorText) {
                if (rules[m].selectorText.toLowerCase() === selector) {
                    done = true;
                    rules[m].style[property] = value;
                    console.log(rules[m].style);
                    break;
                }
            }
        }
        if (done) {
            break;
        }
    }
};

function set_notifcation_time(seconds) {
    // seconds is string number -eg. "5"
    // animation: 10s ease 0s 1 normal forwards running hide;
    //changeRule('.obs .hideme','animation', seconds +'s ease 0s 1 normal forwards running hide');
    changeRule('.notification.notify','animation-duration', seconds +'s');
    ps2_showimagetime = seconds;
    localStorage.ps2_showimagetime = seconds;
}

// load options

var count_one = new Audio();
count_one.src = 'audio/one.mp3';

// obs default setup - overridden with values from localstorage 
var obs_config={};

obs_config.stats={}; obs_config.events={}; obs_config.notifications={}; obs_config.pop={};

obs_config.pop.world = 1; // default connery for picard
obs_config.pop.top = 348;
obs_config.pop.left = 0;
obs_config.pop.scale = 1.0;
obs_config.pop.enabled = true;
obs_config.stats.hidden_stats = [];
obs_config.stats.scale = 1.0;
obs_config.events.scale = 1.0;
obs_config.notifications.scale = 1.0;
obs_config.stats.top = 48;
obs_config.stats.left = 130;
obs_config.stats.enabled = true;
obs_config.events.top = 145;
obs_config.events.left = 630;
obs_config.events.enabled = true;
obs_config.notifications.top = -50;
obs_config.notifications.left = 440;
obs_config.notifications.enabled = true;
ls_obs_string = localStorage.getItem('obs_config');
if (ls_obs_string) {
    // load saved
    // overwrite current values with any in saved - new props will be saved and loaded next time
    obs_config_loaded = JSON.parse(ls_obs_string);
    for (const property in obs_config_loaded) {
        obs_config[property] = obs_config_loaded[property];
    };
}
else {
    // save default
    localStorage.obs_config = JSON.stringify(obs_config);
}

set_world(obs_config.pop.world);

function reset_obs() {
    obs_config={};

    obs_config.stats={}; obs_config.events={}; obs_config.notifications={}; obs_config.pop={};

    obs_config.pop.world = 1; // default connery for picard
    obs_config.pop.top = 348;
    obs_config.pop.left = 0;
    obs_config.pop.scale = 1.0;
    obs_config.pop.enabled = true;
    obs_config.stats.hidden_stats = [];
    obs_config.stats.scale = 1.0;
    obs_config.events.scale = 1.0;
    obs_config.notifications.scale = 1.0;
    obs_config.stats.top = 48;
    obs_config.stats.left = 30;
    obs_config.stats.enabled = true;
    obs_config.events.top = 145;
    obs_config.events.left = 430;
    obs_config.events.enabled = true;
    obs_config.notifications.top = -50;
    obs_config.notifications.left = 440;
    obs_config.notifications.enabled = true;

    set_obs_values('stats');
    set_obs_values('events');
    set_obs_values('notifications');
    set_obs_values('pop');

    localStorage.obs_config = JSON.stringify(obs_config);

}

function set_obs_values(el_id) {
    el = document.getElementById(el_id);
    if (el) {
        el.style.top = parseInt(obs_config[el_id].top);
        el.style.left = parseInt(obs_config[el_id].left);
        scale = parseFloat(obs_config[el_id].scale);
        enabled = obs_config[el_id].enabled;
        if (!obs_config[el_id].hasOwnProperty('enabled')) {
            enabled = true;
        }
        el.style.transform = `scale(${scale})`;
        if (!enabled) {
            el.classList.remove('enabled');
        }
        else {
            el.classList.add('enabled');
        }
        localStorage.obs_config = JSON.stringify(obs_config); // save obs config
    }
}

set_obs_values('stats');
set_obs_values('events');
set_obs_values('notifications');
set_obs_values('pop');
console.log(obs_config);
obs_config.stats.hidden_stats.forEach(stat => {
    document.getElementById(stat).classList.add('hide_obs');
});

function set_world(id) {
    console.log('setting world to ',id);
    _worldId = parseInt(id);
    worldname = "Connery";
    if (id==1) {
        worldname = "Connery";
    }
    else if (id==17) {
        worldname = "Emerald";
    }
    else if (id==40) {
        worldname = "SolTech";
    }
    else if (id==10) {
        worldname = "Miller";
    }
    else if (id==13) {
        worldname = "Cobalt";
    }
    else if (id==25) {
        worldname = "Briggs";
    }
    obs_config.pop.world = id;
    document.querySelector('.pop_server').innerText = worldname;
    localStorage.obs_config = JSON.stringify(obs_config); // save obs config
}

/* document.getElementById('world').addEventListener('change',function(e){
    v = e.target.value;
    set_world(v);
}); */

// stats visibility handlers
document.getElementById('stats').addEventListener('click',function(e){
    if (document.body.classList.contains('obs')) {
        c = e.target.closest('.control');
        if (c) {
            stat_id = c.id;
            if (c.classList.contains('hide_obs')) {
                // unhide
                obs_config.stats.hidden_stats = obs_config.stats.hidden_stats.filter(e => e !== stat_id); 
            }
            else {
                // hide
                obs_config.stats.hidden_stats.push(stat_id);
            }
            c.classList.toggle('hide_obs');
            localStorage.obs_config = JSON.stringify(obs_config); // save obs config
        }
    }
});

// end obs config setup

var countkills = false;
var fullscreenanimations = false;
var darkmode = false;

countkills = JSON.parse(localStorage.getItem('ps2_countkills'));
document.getElementById('countkills').checked = countkills;

fullscreenanimations = JSON.parse(localStorage.getItem('ps2_fullscreenanimations'));
document.getElementById('fullscreenanimations').checked = fullscreenanimations;

darkmode = JSON.parse(localStorage.getItem('ps2_darkmode'));
document.getElementById('darkmode').checked = darkmode;
if (darkmode) {
    document.body.classList.add('darkmode');
}

var stored_playerlist = JSON.parse(localStorage.getItem('ps2_players'));
if (stored_playerlist) {
    stored_playerlist.forEach(stored_player => {
        playerlist.push(stored_player);
    });
}
var ps2_extraaudio = JSON.parse(localStorage.getItem('ps2_extraaudio'));
if (ps2_extraaudio===null) {
    ps2_extraaudio = [];
}
// if no players are tracked, show reminder for potentially new users!
if (playerlist.length==0) {
    document.getElementById('noplayers_modal').classList.add('is-active');
}

var ps2_showimagetime = localStorage.ps2_showimagetime;
if (!ps2_showimagetime) {
    ps2_showimagetime = "5";
}
else {
    document.getElementById('image_display_time').value = ps2_showimagetime.toString();
    set_notifcation_time(ps2_showimagetime);
}

test_audio = new Audio('audio/ting.mp3');
window.mute_test = false;

// setup global vars
var session_start_time = Math.floor((new Date()).getTime() / 1000);
var event_counter = 0;
var killstreak=0; // reset by death
var spamstreak=0;
var killstreak_was=0;
var multikills_was=0;
var c4counter=[];
var kills=0;
var deaths=0;
var kd=1;
var kpm=0;
var max_killstreak=0;
var bodyshotkillstreak=0;
var headshotstreak=0;
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
var shotgun_killstreak = 0; // reset by death and non-shotgun kill
var shotgun_killstreak_timestamp = 0;
var orbital_killstreak = 0;
var last_res_timestamp = 0;
var last_suicide_death_timestamp  = 0;
var last_vehicle_kill_timestamp = 1;

var cur_achievements = []; // per event stack of triggered achievements - sorted by 

var last_kill_timestamp = 0;
var multikills = 0;
var multikill_window = 10; // secs to multikill reset
var ragequit_watchlist = {};


function insert_row (data, msg) {         
    var events_table = document.getElementById('events_body'); 
    var cls='';
    var pills='';

    if (!data) {
        data = {};
        data.payload= {};
        data.payload.timestamp = new Date().getTime();
    }

    if (msg) {
        var row=events_table.insertRow(0);
        row.classList.add('hideme','message_row');
        row.className += cls;
        var time = row.insertCell();
        var event = row.insertCell();
        var special = row.insertCell();
        if (data) {
            time.innerHTML = "<span class='nice_timestamp'>" + nice_date(data.payload.timestamp) + "</span>";
        }
        else {
            time.innerHTML = Date();
        }
        event.innerHTML = msg;
        if (data) {
            cur_achievements.forEach(achievement_on_stack => {
                //console.log('putting pill for achievement ', achievement_on_stack);
                pills += `
                <span class='tag is-dark'>${achievement_on_stack.name}</span>
                `;
            });
        }

        special.innerHTML = pills;
        //row.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
    }
}



load_config(true); // important - do this after previous built-in hardcoded achievements have been created :)
// true is passed to signify intitial load - this allows us to add new hardcoded sounds that are not overwritten by old saves

function reset_stats() {
    
    window.kpm=0;
    window.event_counter = 0;
    window.killstreak=0; // reset by death
    window.deathstreak=0;
    window.spamstreak=0;
    window.killstreak_was=0;
    window.multikills_was=0;
    window.c4counter=[];
    window.kills=0;
    window.deaths=0;
    window.kd=1;
    window.max_killstreak=0;
    window.bodyshotkillstreak=0;
    window.headshotstreak=0;
    window.revive_count_streak=0; // reset by death
    window.mines_destroyed=0;
    window.proxy_kills_streak=0; // reset by death
    window.assist_streak=0; // reset by death
    window.rocket_kills_streak=0; // reset by death
    window.ground_vs_infantry_streak=0; // reset by death
    window.ground_vs_infantry=0; 
    window.air_vs_air_streak=0; // reset by death
    window.air_vs_air=0; 
    window.air_vs_ground_streak=0; // reset by death
    window.air_vs_ground;
    window.spot_kill_count=0;
    window.motion_sensor_kills=0;
    window.characters={};
    window.synth = window.speechSynthesis;
    window.shotgun_killstreak = 0; // reset by death and non-shotgun kill
    window.shotgun_killstreak_timestamp = 0;
    window.orbital_killstreak=0;

    window.cur_achievements = []; // per event stack of triggered achievements - sorted by 

    window.last_kill_timestamp = 0;
    window.multikills = 0;
    window.multikill_window = 10; // secs to multikill reset
    window.ragequit_watchlist = {};
    update_stats();
}

function trigger_animation(trigger_id, force=false) {
    if (!window.fullscreenanimations && !force) {
        return false;
    }
    // make animation, if available, active 
    animation_el = document.getElementById('animation_' + trigger_id); // e.g. animation_roadkill
    if (animation_el) {
        // ooh, we have an animation
        // todo - check if animations are turned on
        animation_el.classList.add('active');
        // retrigger css animation by cloning element - https://css-tricks.com/restart-css-animation/
        var newone = animation_el.cloneNode(true);
        animation_el.parentNode.replaceChild(newone, animation_el);

        // remove active after 4 seconds
        // check for previous timer and clear and replace
        index = 'animation_timeout_for_'+trigger_id;
        //console.log(index);
        if (window.hasOwnProperty(index)) {
            if (window[index]!==null) {
                //console.log('clearing running animation timeout');
                clearTimeout(window[index]); // clear old timer, extending 4 second window
            }
        }
        window[index] = setTimeout(function(trigger_id){
            animation_el = document.getElementById('animation_' + trigger_id);
            animation_el.classList.remove('active');
            window['animation_timeout_for_'+trigger_id]=null; // clear anim for starting again
        }, 5000, trigger_id); // max animation length of 4 seconds, then active removed
    }
}

function update_stats() {
    auto_updaters = document.querySelectorAll('.autoupdate');
    auto_updaters.forEach(auto => {
        variable = auto.dataset.variable;
        value = window[variable];
        if (value||value===0) {
            auto.innerText = value.toString();
        }
        // add value to stat wrapper for css purposes
        wrap = auto.closest('.control');
        wrap.dataset.value = value;

        if (variable=='killstreak') {
            //console.log('killstreak update');
            var ksw = document.getElementById('killstreak_wrap');
            if (value>0) {
                ksw.classList.add('overfive');
            }
            else {
                ksw.classList.remove('overfive');
            }
        }
    });
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
    return (date.getHours()<10?'0':'') + date.getHours() + ':' + (date.getMinutes()<10?'0':'') + date.getMinutes() + ':' + (date.getSeconds()<10?'0':'') + date.getSeconds();
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
        //console.log('Printing character ',character,' for event ',event.payload);
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
                if (event.payload.event_name=="Death") {
                    // only present in death event, loadout only available for vehicledestory attacker
                    loadout_id = event.payload.character_loadout_id;
                }
                else {
                    loadout_id = null;
                    console.log ('Vehicle kill - no loadout available for victim.');
                }
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
                console.log('Unknown profile for loadout for loadout - ignore if vehicle kill: ',loadout,' in event ',event);
            }
        }
        else {
            // can get here if vehicledestroy that's your vehicle, no loadout for a vehicle
            //console.log('Unknown loadout for event char loadout: ',event);
        }
        char+="<span class='profile_name "+profile_name+"'>" + profile_name + "</span>";
        char+='<span class="char faction faction'+character.faction_id+'"> ';
            char+='<span class="charname">';
            if (character.hasOwnProperty('outfit')) {
                char+='<span class="outfit">'+characters[character_id].character_list[0].outfit.alias+'</span>&nbsp;';
            }
            char+= character.name.first+'</span> ';
            char+='<span class="br">BR: '+character.battle_rank.value+'</span> ';
            //char+='</span>';

            stats_history = character.stats.stat_history;
            if (stats_history) {
                kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            }
            else {
                kdr = "?";
            }
            char+='<span class="br kdr">KD: ' + kdr + '</span>'
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
        if (data.payload.other_id.length > 17) {
            // could be character - if shorter, probably other internal id
            other_id = data.payload.other_id;
        }
    }
    jQuery.when(get_vehicle(data.payload.vehicle_id),get_vehicle(data.payload.attacker_vehicle_id),get_character(data.payload.character_id), get_character(data.payload.other_id), get_character(data.payload.attacker_character_id), get_weapon(data.payload.attacker_weapon_id) ).then(function(){
        // all promised data available, show event
        //console.log ('All promises handled, doing logic now');

        process_event(data);
        update_stats();
        
        // can also access triggered achievements by this event here: window.cur_achievements - this is cleared next event

        var events_table = document.getElementById('events_body');          
        //var events_table = document.getElementById('events');
        var cls='';
        var msg='';
        var pills='';

        
        if (data.payload.event_name=="GainExperience") {
            // do messages for none-displayed achievements
            if ( (data.payload.experience_id=='7' || data.payload.experience_id=='53') && is_player(data.payload.character_id)) {
                msg+='<span class="event_type you_revived">You revived </span>';
                console.log(msg);
                cls+=' revive info ';
                msg+=print_character(data.payload.other_id, data);
                revive_count_streak++;
            }
            else if (data.payload.experience_id=='2' && is_player(data.payload.character_id)) {
                assist_streak++;
            }
            else if ( (data.payload.experience_id=='7' || data.payload.experience_id=='53') && is_player(data.payload.other_id)) {
                msg+='<span class="event_type you_revived">You were revived by </span>';
                console.log(msg);
                cls+=' revive info ';
                msg+=print_character(data.payload.character_id, data);
                window.last_res_timestamp = data.payload.timestamp;
                window.deaths--;
            }
        }		
        if (data.payload.event_name=='Death') {

            //console.log ('Comparing ' + data.payload.attacker_character_id + ' to ' + window.char);
            if (is_player(data.payload.attacker_character_id)) {
                msg+='<span class="event_type you_killed">You killed </span>';
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
                        msg = "<span class='event_type you_teamkilled'>You teamkilled </span>"
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
                        msg+= ' <span class="squished">' + vehicle_name + '</span>';
                    }
                    else {
                        msg+= ' using just your mind! ';
                    }
                }
            }
            else {
            
                cls+=' death ';
                
                if (is_tk(data)) {
                    msg += "<span class='event_type tk killed_by'>You were teamkilled by </span>"
                    cls+=' tk ';
                }
                else {
                    msg += '<span class="event_type killed_by">You were killed by </span>';
                }
                msg+=print_character(data.payload.attacker_character_id, data);
                // get weapon
                if (data.payload.attacker_weapon_id!='0') {
                    msg += display_weapon_and_type(data.payload.attacker_weapon_id);
                }
                else if (data.payload.attacker_vehicle_id!='0') {
                    // maybe got squished
                    vehicle_name = get_vehicle_name(data.payload.attacker_vehicle_id);
                    msg+= ' <span class="squished_by">' + vehicle_name + '</span>';
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
                if (is_same_faction(data.payload.character_id, data.payload.attacker_character_id)) {
                    // teamkill 
                    cls+=' tk ';
                    if (vehicle_name) {
                        msg+='Your '+vehicle_name+' was put to sleep by ';
                    }
                    else {
                        msg+='Your [unknown] was put to sleep by ';
                    }
                }
                else {
                    // legit enemy killed your vehicle
                    if (vehicle_name) {
                        msg+='Your '+vehicle_name+' was destroyed by ';
                    }
                    else {
                        msg+='Your [unknown] was destroyed by ';
                    }
                }
                msg+=print_character(data.payload.attacker_character_id, data);
            }
            else {
                // you killed a vehicle
                msg+='<span class="event_type vehicle_destroy"> You destroyed </span> ';
                vehicle_name = get_vehicle_name(data.payload.vehicle_id);
                if (is_same_faction(data.payload.character_id, data.payload.attacker_character_id)) {
                    // teamkill 
                    cls+=' tk ';
                    if (data.payload.character_id=="0") {
                        msg += "(for humane reasons) a friendly " +vehicle_name+' ';
                    }
                    else {
                        msg+=print_character(data.payload.character_id, data);
                        msg += vehicle_name+'. Woopsy!';
                    }
                }
                else {
                    if (data.payload.character_id=="0") {
                        msg += " a " +vehicle_name+' ';
                    }
                    else {
                        msg += print_character(data.payload.character_id, data);
                        msg += vehicle_name+' ';
                    }
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
            var row=events_table.insertRow(0);
            row.classList.add('hideme');
            row.classList.add('killboard_entry');

            let attacker_faction = "unknown";
            if (data.payload.hasOwnProperty('attacker_character_id')) {
                let fac = get_faction (data.payload.attacker_character_id);
                if (fac) {
                    attacker_faction = fac;
                }
            }
            row.classList.add('attacker_faction_' + attacker_faction);

            let character_faction = "unknown";
            if (data.payload.hasOwnProperty('character_id')) {
                let fac = get_faction (data.payload.character_id);
                if (fac) {
                    character_faction = fac;
                }
            }
            row.classList.add('character_faction_' + character_faction);

            row.className += cls;
            var time = row.insertCell();
            time.classList.add('timestamp');
            var event = row.insertCell();
            event.classList.add('event_info');
            var special = row.insertCell();
            special.classList.add('pills');
            time.innerHTML = "<span class='nice_timestamp'>" + nice_date(data.payload.timestamp) + "</span>";
            event.innerHTML = msg;

            cur_achievements.forEach(achievement_on_stack => {
                //console.log('putting pill for achievement ', achievement_on_stack);
                if (achievement_on_stack.id!=='normalkill') {
                    // skip vanilla kill pill
                    pills += `
                    <span class='tag is-dark'>${achievement_on_stack.name}</span>
                    `;
                }
            });

            special.innerHTML = pills;
            //row.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
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
    say ('tracking ' + playername );
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
    var url = "https://census.daybreakgames.com/s:bax/json/get/ps2:v2/character/?c:resolve=world,online_status&character_id="+char_id+"&c:limit=1&callback=?";
    jQuery.getJSON(url,function(json){
        var search = json;
        if (search.hasOwnProperty('errorCode')) {
            console.log('API Error - try again later'); 
            return false;
        }
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
                set_world(search.character_list[0].world_id);
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



function update_kd() {
    if (kills>0) {
        if (deaths==0) {
            kd=kills;
        }
        else {
            kd = (kills/deaths).toFixed(2);
        }
    }
    else {
        kd=0;
    }

}

function process_event(event) {

    event.is_kill = is_kill(event);
    event.is_death = is_death(event);
    event.is_tk = is_tk(event);
    update_group_num_killed(event);
    
    if (event.payload.event_name=="PlayerLogin") {
        c = get_local_character(event.payload.character_id);
        notify(c.name.first + ' logged in');
        say('Player logged in');
        window.session_start_time = Math.floor((new Date()).getTime() / 1000);
    }
    if (event.payload.event_name=="PlayerLogout") {
        if (is_player(event.payload.character_id)) {
            c = get_local_character(event.payload.character_id);
            notify(c.name.first + ' logged out','is-warning');
            say('Player logged out');
            set_player_offline(event.payload.character_id);
        }
    }

    if (event.payload.event_name=="VehicleDestroy") {
        if (!event.is_tk) {
            // set last vehicle kill timestamp for sacrificial lamb trigger (or others!)
            window.last_vehicle_kill_timestamp = event.payload.timestamp;
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
            window.deathstreak++;
            if (window.killstreak>1) {
                insert_row (null, 'You died! Your killstreak was ' + window.killstreak.toString());
            }
            window.knife_killstreak=0;
            window.shotgun_killstreak=0;
            window.killstreak_was = window.killstreak;
            window.multikills_was = window.multikills;
            window.multikills = 0;
            window.killstreak=0;
            //window.revive_count_streak=0;
            window.spamstreak=0;
            window.assist_streak=0; // end assist streak
            multikills=0;
            window.deaths++;
            if (is_player(event.payload.attacker_character_id)) {
                window.last_suicide_death_timestamp = event.payload.timestamp;
            }
            update_kd();
            if (!is_player(event.payload.attacker_character_id)) {
                // not suicide
                // update character with killcount for revenge/repeat etc
                char = get_local_character(event.payload.attacker_character_id);
                if (char) {
                    char.killstreak=0;
                    if (char.hasOwnProperty('deathcount')) {
                        char.deathcount++;
                        char.deathstreak++;
                        
                    }
                    else {
                        char.deathcount=1;
                        char.deathstreak=1;
                    }
                    char.primed_for_revenge = true;
                }
                else {
                    console.log('Local character not available for attacker in event: ',event);
                }
                // orbital killstreak ends with death, but not suicide :)
                window.orbital_killstreak=0;
            }
        }
        else {
            if (!is_tk(event)) {
                // genuine kill
                window.revive_count_streak=0;
                weapon = get_local_weapon (event.payload.attacker_weapon_id);
                if (weapon) {
                    type = get_weapon_type (weapon.item_category_id);
                    if (type=="Shotgun") {
                        time_since_last_shotgun_kill = parseInt(event.payload.timestamp) - parseInt(window.shotgun_killstreak_timestamp);
                        if (time_since_last_shotgun_kill<5) {
                            window.shotgun_killstreak++;
                        }
                    }
                    else {
                        window.shotgun_killstreak=0;
                    }
                    
                    if (type=="Knife") {
                        window.knife_killstreak++;
                    }
                    if (event.payload.attacker_weapon_id=='432'||event.payload.attacker_weapon_id=='800623') {
                        if (window.c4counter.hasOwnProperty(event.payload.timestamp)) {
                            window.c4counter[event.payload.timestamp]++;
                        }
                        else {
                            window.c4counter[event.payload.timestamp]=1;
                        }
                    }

                    if (event.payload.attacker_weapon_id=='70057') {
                        window.orbital_killstreak++;
                    }
                    else {
                        if (!event.payload.attacker_weapon_id!='0') {
                            // got kill with another weapon
                            window.orbital_killstreak=0;
                        }
                    }
                }
                // killstreak
                window.killstreak++;
                window.deathstreak=0;
                if (event.payload.is_headshot=="0") {
                    window.bodyshotkillstreak++;
                    window.headshotstreak=0;
                }
                else {
                    window.bodyshotkillstreak=0;
                    window.headshotstreak++;
                }
                window.kills++;
                update_kd();
                window.assist_streak=0; // end assist streak
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
                // update character with killcount for revenge/repeat etc
                char = get_local_character(event.payload.character_id);
                if (char) {
                    char.deathstreak=0;
                    if (char.hasOwnProperty('killcount')) {
                        char.killcount++;
                    }
                    else {
                        char.killcount=1;
                    }
                    if (char.hasOwnProperty('killstreak')) {
                        char.killstreak++;
                    }
                    else {
                        char.killstreak=1;
                    }
                }
                //char.primed_for_revenge = false; // has to be cleared by achievement itself
            }
            else {
                //say ('Teamkill');
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

    // kill tts
    say_kills = false;
    if (window.countkills && window.cur_achievements.length==0 && is_kill(event) && killstreak>1) {
        // no triggers
        say_kills = true;
    }
    if (window.countkills && window.cur_achievements.length==1 && is_kill(event) && window.cur_achievements[0].id=='headshot' && killstreak>1) {
        // just one trigger and its a headshot
        say_kills = true;
    }
    
    if (say_kills) {
        say(killstreak.toString());
    }

    if (window.user=='n7jpicard') {
        // do count
        if (is_kill(event) && !is_tk(event)) {
            if (killstreak==1) {
                count_one.volume = parseFloat(document.getElementById('volume').value)/100.0;
                count_one.play();
            }
            if (killstreak==2) {
                doublekill.play();
            }
            if (killstreak==3) {
                triplekill.play();
            }
            if (killstreak==4) {
                multikill.play();
            }
            if (killstreak==5) {
                megakill.play();
            }
            if (killstreak==6) {
                ultrakill.play();
            }
            if (killstreak==7) {
                monsterkill.play();
            }
            if (killstreak==8) {
                ludicrous.play();
            }
            if (killstreak==9) {
                holyshit.play();
            }
            if (killstreak==10) {
                decakills.play();
            }
        }
    }

    // sort by priority
    // and trigger top enabled audio, let the rest trigger notifications
    var notifications_only = false;
    window.cur_achievements.sort((a, b) => (a.priority > b.priority) ? 1 : -1);
    var triggered_count=0;
    var triggered_animation_count=0;
    for (sorted_index=0; sorted_index<window.cur_achievements.length; sorted_index++) {
        if (window.cur_achievements[sorted_index].enabled) {
            if (triggered_animation_count==0) {
                // for highest priority trigger, play the animation (if available)
                animation_el = document.getElementById('animation_' + window.cur_achievements[sorted_index].id); // e.g. animation_roadkill
                if (animation_el) {
                    trigger_animation(window.cur_achievements[sorted_index].id);
                    triggered_animation_count++; 
                }
            }
            if (triggered_count>-1) { // trigger all now - test priority
                // only trigger highest priority
                window.cur_achievements[sorted_index].trigger(notifications_only);
            }
            triggered_count++;
            notifications_only = true; // loop through rest and trigger notifications, but no audio pls
        }
    }
    update_stats();
}

document.getElementById('desktop_view').addEventListener('click',function(e){
    document.getElementsByTagName('body')[0].classList.remove('obs');
    document.getElementsByTagName('html')[0].classList.remove('isobs');
});
document.getElementsByTagName('body')[0].addEventListener('keyup',function(e){
    // toggle obs view if space pressed in obs view
    var code = e.which;
    if(code==32) {
        if (document.getElementsByTagName('body')[0].classList.contains('obs')) {
            e.preventDefault();
            document.getElementsByTagName('body')[0].classList.remove('obs');
            document.getElementsByTagName('html')[0].classList.remove('isobs');
        }
    }
    if (e.key=='r' && document.body.classList.contains('obs')) {
        trigger_animation('decikills',true);
    }

});

document.getElementsByTagName('body')[0].addEventListener('keyup',function(e){
    // toggle obs view if space pressed in obs view
    var code = e.which;
    if(code==70) {
        ksw = document.getElementById('killstreak_wrap');
        ksw.classList.toggle('overfive');
    }
});


// Make the elements moveable AND scaleable:

moveables = document.querySelectorAll('.moveable');
moveables.forEach(moveable => {
    dragElement(moveable);
    moveable.addEventListener('wheel',function(e){
        if (!document.body.classList.contains('obs')) {
            return false;
        }
        m = e.target.closest('.moveable');
        if (!m.dataset.hasOwnProperty('scale')) {
            m.dataset.scale = 1.0;
        }
        scale = parseFloat(m.dataset.scale);
        scale += e.deltaY * -0.0001;
        m.dataset.scale = scale;
        scale = Math.min(Math.max(.5, scale), 3);
        m.style.transform = `scale(${scale})`;
        // save obs_config
        obs_config[m.id].scale = scale;
        localStorage.obs_config = JSON.stringify(obs_config);
    });
    moveable.addEventListener('contextmenu',function(e){
        if (document.body.classList.contains('obs')) {
            // only in obs mode
            if (!document.body.classList.contains('obs')) {
                return true;
            }
            e.preventDefault();
            m = e.target.closest('.moveable');
            m.classList.toggle('enabled');
            if (m.classList.contains('enabled')) {
                obs_config[m.id].enabled = true;
            }
            else {
                obs_config[m.id].enabled = false;
            }
            localStorage.obs_config = JSON.stringify(obs_config); // save obs config
            return false;
        }
    });
});

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    if (!document.body.classList.contains('obs')) {
        return true;
    }
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    if (!document.body.classList.contains('obs')) {
        return true;
    }
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    id = elmnt.id;
    // save in obs_config
    obs_config[id].top = elmnt.offsetTop - pos2;
    obs_config[id].left = elmnt.offsetLeft - pos1;
    localStorage.obs_config = JSON.stringify(obs_config);
  }

  function closeDragElement() {
    if (!document.body.classList.contains('obs')) {
        return false;
    }
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
// end moveable




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
        var char_name = this.parentElement.querySelector('.is-link').innerText;
        console.log(char_name);
        if (document.getElementById('playername').innerText==char_name) {
            document.getElementById('playername').innerText = "Player Offline";
            document.getElementById('playername').classList.add('offline');
            document.getElementById('playername').classList.remove('online');
        }
        console.log('removing:');
        console.log(delete_char_id);
        jQuery(this).closest('div.tags').remove(); 
        for (let i = playerlist.length - 1; i >= 0; i--) {
            if (playerlist[i].char_id == delete_char_id.toString()) {
                // todo: unsubscribe
                unsubscribe_from_character(delete_char_id.toString());
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
        if (is_player(char_id)) {
            alert('Player already being tracked!');
            return false;
        }
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

    function add_population(json) {
        //console.log('add_population');
        //console.log(json);
        connery_online_count = json.ServerOnline[_worldId];
        document.querySelector('.pop_total').innerText = connery_online_count.toString();
        connery_nc_online_count = json.FactionOnline[_worldId][2];
        connery_tr_online_count = json.FactionOnline[_worldId][3];
        connery_vs_online_count = json.FactionOnline[_worldId][1];
        document.querySelector('#nc_pop').innerText = connery_nc_online_count.toString();
        document.querySelector('#tr_pop').innerText = connery_tr_online_count.toString();
        document.querySelector('#vs_pop').innerText = connery_vs_online_count.toString();
    }
    function add_continent_population(json) {
        //console.log('add_continent_population');
        //console.log(json);
    }

    window.worldsocket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax'); // cont lock
    window.socket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax'); // player stats
    window.logoutsocket = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:bax'); // ragequit
    window.ws = new WebSocket("wss://ps2.fisu.pw:36211/"); // stats from fisu
    ws.onmessage = function(evt) {
        var json = JSON.parse(evt.data);
        switch (json.Type) {
        /* case "ActivityStatistics":
            parse_activity(json);
            break;
        case "OnlineCountHistory":
            parse_population(json);
            break; */
        case "OnlineCount":
            add_population(json);
            break;
        case "PlayerCount":
            add_continent_population(json.CountFaction[_worldId]);
            break;
        default:
            break
        }
    }
    ;
    ws.onopen = function() {
        ws.send(JSON.stringify({
            Type: "Init",
            Action: "Activity",
            Environment: _environment,
            WorldId: _worldId
        }))
    }
    ;
    ws.onerror = function(evt) {
        console.log(evt)
    }


    logoutsocket.onmessage = function(data) {
        if (data.data.hasOwnProperty('payload')) {
            if (data.payload.event_name!="PlayerLogout") {
                // do ragequit tests/checks etc
                console.log('Logout event');
                console.log(data);
                display_event(data);
            }
        }
    }


    // handle dom changes and monitor unprocessed variables

    worldsocket.onopen = function(event) {
        var sub_data = {"service":"event","action":"subscribe","eventNames":["ContinentLock"],"worlds":["1","9","10","11","13","17","18","19","25"]};
        worldsocket.send(JSON.stringify(sub_data));
    }
    worldsocket.onerror = function(evt) {
        console.log('Error with world websocket');
        console.log(evt);
    }
    worldsocket.onmessage = function(data) {
        if (data.hasOwnProperty('data')) {
            if (data.data.hasOwnProperty('payload')) {
                console.log('World event has payload:');
                console.log(data.payload);
                if (parseInt(data.payload.world_id) ==_worldId ) {
                    // cont locked on my server
                    if (data.payload.zone_id == zone_id) {
                        // ... on the continent I am active on
                        if (window.hasOwnProperty('player')) {
                            char_id = player.char_id;
                            char = get_local_character(char_id);
                            if (char.faction_id==data.payload.triggering_faction) {
                                // ... you WON the alert :)
                                if (contcap.enabled) {
                                    contcap.trigger();
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
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
                reset_stats();
            }
            if (data.payload.event_name=="PlayerLogin") {
                set_player_online (data.payload.character_id);
                set_world(data.payload.world_id);
            }
            if (data.payload.event_name=="Death"||data.payload.event_name=="VehicleDestroy"||data.payload.event_name=="GainExperience") {
                // set current continent based on event
                window.zone_id = data.payload.zone_id;
            }
            //messagesList.innerHTML += '<hr>';
            //messagesList.innerHTML += '<li class="received"><span>Received:</span>' + message + '</li>';
            if (data.payload.event_name!="GainExperience") {
                // don't push exp gain events onto stack - not needed, we can handle global counters in the event processing
                window.allevents.push(data);
            }
            else {
                // push experience
                window.gainexperienceevents.push(data); // remove when live to limit mem use
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
document.querySelector('#playername').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#playermodal').classList.toggle('is-active');
});

document.querySelector('#show_settings_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#settings_modal').classList.toggle('is-active');
});

document.querySelector('#show_debug_modal').addEventListener('click',function(e){
    e.preventDefault();
    // update debug content
    //let last_five_events = allevents.slice(Math.max(allevents.length - 5, 0));
    let last_five_events = gainexperienceevents.slice(Math.max(allevents.length - 5, 0));
    let last_five_events_json = JSON.stringify(last_five_events, null, 4);
    document.getElementById('debug_content').innerHTML = last_five_events_json;
    document.querySelector('#debug_modal').classList.toggle('is-active');
});

document.querySelector('#show_about_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#about_modal').classList.toggle('is-active');
});


document.querySelector('#show_help_modal').addEventListener('click',function(e){
    e.preventDefault();
    document.querySelector('#help_modal').classList.toggle('is-active');
});


/* document.querySelector('#show_export_modal').addEventListener('click',function(e){
    e.preventDefault();
    // update config
    config_textarea = document.getElementById('config_export');
    ach_json = JSON.stringify(new_achievements);
    window.temp_config = JSON.parse(ach_json);
    final_config_string = JSON.stringify(temp_config);
    config_textarea.innerText = JSON.stringify(final_config_string);
    // show modal
    document.querySelector('#export_modal').classList.toggle('is-active');
    
}); */

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

document.getElementById('toggle_view').addEventListener('click',function(){
    document.getElementsByTagName('body')[0].classList.add('obs');
    document.getElementsByTagName('html')[0].classList.add('isobs');
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

// handle new custom image submit
document.getElementById('custom_image_form').addEventListener('submit',function(e){
    e.preventDefault();
    // create new / edit existin custom trigger, add markup to manage audio dialog and save
    url = document.getElementById('custom_image_url').value;
    ach_id = document.getElementById('edit_image_achievement_id').value;
    ach = get_achievement(ach_id);
    if (url===null||url=='') {
        url = window.root + 'images/noimage.png';
        //alert('URL cannot be empty');
        //return false;
    }
    // todo - test url for https etc
    ach.custom_image = url;
    console.log('updating image for:',ach);
    document.getElementById('edit_image_modal').classList.toggle('is-active');
    //render_all_achievement_cards(); // redraw all
    save_config();
    return false;
});


// handle new custom trigger submit
document.getElementById('custom_trigger_form').addEventListener('submit',function(e){
    e.preventDefault();
    // create new / edit existin custom trigger, add markup to manage audio dialog and save
    label = document.getElementById('custom_trigger_name').value;
    id = label.toLowerCase().replace(/\s/g, '');
    description = document.getElementById('custom_trigger_description').value;
    onkill = document.querySelector('input[name="onkill"]:checked').value;
    group_kill_trigger_value = document.getElementById('group_kill_trigger_value').value;
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
            edit_ach.group_kill_trigger_value = group_kill_trigger_value;
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
        foo.group_kill_trigger_value = group_kill_trigger_value;
        //new_achievements.push(foo); // not needed, new object adds itself to new_achievement object
        console.log('Added new custom weapon trigger: ',foo);
    }
    document.getElementById('custom_trigger_modal').classList.toggle('is-active');
    save_config();
    return false;
});




function save_config() {
    document.getElementById('ajax').classList.add('active');
    // strip name/desc and jsonify into localstorage
    ach_json = JSON.stringify(new_achievements);
    window.temp_config = JSON.parse(ach_json);
    for (n=0;n<temp_config.length;n++) {
        /* if (!temp_config[n].custom_weapon_trigger) {
            delete temp_config[n].name;
            delete temp_config[n].description;
            delete temp_config[n].sounds;
            delete temp_config[n].priority;
            delete temp_config[n].interruptable;
        } */
         // set volume of each sound
      /*   temp_config[n].sounds.forEach(function(sound,index){
            if (temp_config[n].hasOwnProperty('volumes')) {
                sound.config_volume = temp_config[n].volumes[index];
            }
            else {
                sound.config_volume = 100; 
            }
        }); */
    }
    final_config_string = JSON.stringify(temp_config);
    //localStorage.setItem('ps2_achievements',final_config_string);
    postAjax('', {"action":"save","claim_code":window.claim_code,"config":final_config_string}, function(data) { 
        var response = JSON.parse(data);
        console.log(response);
        if (response.success==1) {
            notify('Config saved!','is-success');
            document.body.classList.add('claimed','authorized');
            load_config();
        }
        else {
            notify(response.msg,'is-warning');
            temp = prompt('Enter your password/passphrase to re-establish ownership of this URL:');
            if (temp!=''&&temp!==null) {
                window.claim_code = temp;
                save_config();
            }
            else {
                document.getElementById('ajax').classList.remove('active');
            }
            /* document.body.classList.add('claimed');
            document.body.classList.remove('authorized'); */
        }
    });
}

document.getElementById('copy_config').addEventListener('click',function(e){
    config_string = JSON.stringify(new_achievements);
    if (config_string) {
        // save string and reload config
        localStorage.setItem('ps2_soundpack_copy', config_string);
        notify('Sound Pack Copied - Ready to paste into your own claimed URL!');
    }
    else {
        notify('Error copying Sound Pack!','is-warning');
    }
});

document.getElementById('copy_and_create_config').addEventListener('click',function(e){
    document.getElementById('copy_and_create_modal').classList.add('is-active');
    config_string = JSON.stringify(new_achievements);
    if (config_string) {
        localStorage.setItem('ps2_soundpack_copy', config_string);
        //notify('Sound Pack Copied - Ready to paste into your own claimed URL!');
    }
    else {
        notify('Error copying Sound Pack!','is-warning');
    }
});

function copy_and_create() {
    // already copied when modal shown by click event for #copy_and_create_config
    new_packname = document.getElementById('copy_and_create_name').value;
    newpack_password = document.getElementById('copy_and_create_password').value;
    new_config = JSON.stringify(new_achievements);
    // action = copy_and_create
    postAjax('', {"action":"copy_and_create","new_packname":new_packname,"newpack_password":newpack_password,"new_config":new_config}, function(data) { 
        var response = JSON.parse(data);
        console.log(response);
        if (response.success==1) {
            notify('New soundpack created - redirecting!','is-success');
            setTimeout(function(){
                window.location = "https://bobmitch.com/ps2/" + new_packname;
            },2000,new_packname);
        }
        else {
            notify(response.msg,'is-warning');
        }
    });
    return false;
}

document.getElementById('paste_config').addEventListener('click',function(e){
    sure = confirm('Are you sure - this will overwrite your current config?');
    if (sure) {
        config_string = localStorage.getItem('ps2_soundpack_copy');
        config = JSON.parse(config_string);
        if (config) {
            // set config, resave to server, and re render
            new_achievements = config;
            save_config();
        }
        else {
            notify('Error pastings soundpack - no copied soundpack found!','is-warning'); 
        }
    }
});

function load_config() {
    // todo - move loading into promise 
    // window.user set in index.php
    document.getElementById('ajax').classList.add('active');
    fetch(window.root + 'userconfigs/' + window.user + "_config.json?nocache=" + (new Date()).getTime())
    .then(response => response.json())
    .then(
        function(config){
            console.log("Remote config: ",config);
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
                            window[config[i].id] = new Achievement(config[i].id, config[i].name, config[i].description, function (event) {
                                if (event.payload.event_name=='Death') {
                                    //console.log ('checking ',event,' for trigger: ',this);
                                    if (is_kill(event) && this.onkill=="1") {
                                        if (!is_tk(event)) {
                                            if (event.payload.attacker_weapon_id==this.custom_weapon_trigger) {
                                                // check group kill value
                                                if (event.group_num_killed == parseInt(window[this.id].group_kill_trigger_value)) {
                                                    return true;
                                                }
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
                            window[config[i].id].custom_weapon_trigger = config[i].custom_weapon_trigger;
                            
                            window[config[i].id].onkill=config[i].onkill;
                            if (config[i].hasOwnProperty('group_kill_trigger_value')) {
                                window[config[i].id].group_kill_trigger_value = config[i].group_kill_trigger_value;
                            }
                            else {
                                window[config[i].id].group_kill_trigger_value = 1;
                            }
                            ach=window[config[i].id];
                            console.log('Added custom trigger',config[i].id);
                        }
                    }
                    if (ach) {
                        // found config for an achievement
                        // TODO make this work for newly added default sounds
                        ach.soundfiles=[];
                        ach.sounds=[];
                        ach.volumes=[];
                        if (config[i].hasOwnProperty('volumes')) {
                            config[i].volumes.forEach(vol => {
                                ach.volumes.push(vol);
                            });
                        }
                        else {
                            for (c=0; c<config[i].soundfiles.length; c++) {
                                ach.volumes.push(100);
                            }
                        }
                        
                        for (x=0; x<config[i].soundfiles.length; x++) {
                            sf = config[i].soundfiles[x];
                            if (sf.startsWith('https')) {
                                ach.soundfiles.push(config[i].soundfiles[x]);
                                s = new Audio(sf);
                                s.crossOrigin = 'anonymous';
                                ach.sounds.push(s); 
                                //console.log('Inserting new audio ',sf,' into ach: ',ach);
                            }
                            else {
                                // assume bobmitch
                                ach.soundfiles.push(config[i].soundfiles[x]);
                                s = new Audio('https://bobmitch.com/ps2/audio/' + sf);
                                s.crossOrigin = 'anonymous';
                                ach.sounds.push(s); 
                            }
                        }
                         // set volume of each sound                         
                        ach.sounds.forEach(function(sound,index){
                            if (config[i].hasOwnProperty('volumes')) {
                                sound.config_volume = config[i].volumes[index];
                            }
                            else {
                                sound.config_volume = 100; 
                            }
                        });
                        // set enabled state
                        if (config[i].hasOwnProperty('enabled')) {
                            if (config[i].enabled) {
                                ach.enabled=true;
                            }
                            else {
                                ach.enabled=false;
                            }
                        }
                        // animation/image
                        if (config[i].hasOwnProperty('custom_image')) {
                            ach.custom_image = config[i].custom_image;
                        }
                    }
                    else {
                        console.log('No matching achievement found during config load for: ',config[i]);
                    }
                    
                }
                render_all_achievement_cards();
                notify('Loaded "'+window.user+'" soundpack!','is-success');
            }
            document.getElementById('ajax').classList.remove('active');
        }
    );

    //config = JSON.parse(localStorage.getItem('ps2_achievements'));
    config=null;

    
    
}

function delete_me (thing_id) {
    thing = document.getElementById(thing_id);
    if (thing) {
        //console.log('deleting: ',thing);
        thing.parentNode.removeChild(thing);
    }
    else {
        //console.log('Thing already gone!');
    }
}

function delete_me_el (thing) {
    if (thing) {
        thing.parentNode.removeChild(thing);
    }
}

window.notification_counter = 0;



function notify(msg, classtext='is-primary') {
    window.notification_counter++;
    notification_id = "notification_" + window.notification_counter.toString();
    notification = document.createElement('div');
    notification.id = notification_id;
    notification.classList.add('is-light','notification','notify',classtext);
    button = document.createElement('button');
    button.classList.add('delete','notify-delete');
    notification.innerHTML = msg;
    notification.appendChild(button);
    setTimeout(function(e){
        delete_me(e);
    }, parseInt(ps2_showimagetime) * 1001, notification_id);
    notifications = document.getElementById('notifications');
    notifications.appendChild(notification);
}

function get_achievement(id) {
    for (n=0; n<new_achievements.length; n++) {
        if (new_achievements[n].id==id) {
            return new_achievements[n];
        }
    }
    return null;
}

document.getElementById('countkills').addEventListener('change',function(e) {
    window.countkills = e.target.checked;
    localStorage.setItem('ps2_countkills',window.countkills);
});

document.getElementById('fullscreenanimations').addEventListener('change',function(e) {
    window.fullscreenanimations = e.target.checked;
    localStorage.setItem('ps2_fullscreenanimations',window.fullscreenanimations);
});

document.getElementById('darkmode').addEventListener('change',function(e) {
    window.darkmode = e.target.checked;
    document.body.classList.toggle('darkmode');
    localStorage.setItem('ps2_darkmode',window.darkmode);
});


// glogal volume

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

// trigger search filters
document.getElementById('triggersearch').addEventListener('keyup',function(e){
    apply_all_filters();
});
document.getElementById('triggersearchclear').addEventListener('click',function(e){
    document.getElementById('triggersearch').value = "";
    apply_all_filters();
});
// trigger filter
var trigger_filters = document.querySelectorAll('#filter_wrap input[name=showtriggers]');
trigger_filters.forEach(filter => {
    filter.addEventListener('change',function(e){
        apply_all_filters();
    });
});

function apply_all_filters() {
    let cur_filter_value = document.querySelector('#filter_wrap input[name=showtriggers]:checked').value; // all, enabled, disabled
    let cur_search_text = document.getElementById('triggersearch').value;
    let cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        let show = false; // hide by default
        // text search takes precedence
        if (cur_search_text) {
            var title = card.querySelector('.card-header-title').innerText;
            // check title first
            if (cur_search_text) {
                if (title.toLowerCase().includes(cur_search_text)) {
                    show = true;
                }
                if (!show) {
                    // if no title match, check description
                    var description = card.querySelector('.content').innerText;
                    if (description.toLowerCase().includes(cur_search_text)) {
                        show = true;
                    }
                }
                if (!show) {
                    // still no match, try mp3 src
                    var mp3_spans = card.querySelectorAll('.tags span.tag');
                    for (var n=0; n<mp3_spans.length; n++) {
                        if (mp3_spans[n].innerText.toLowerCase().includes(cur_search_text)) {
                            show = true;
                            break; 
                        }
                    }
                }
            }
        }
        else {
            // no search, show all for now
            show = true;
        }

        // now do additive filters

        if (cur_filter_value=='enabled') {
            val = card.querySelector('.radio input:checked').value;
            if (val=='off') {
                if (show) {show = false};
            }
        }
        if (cur_filter_value=='disabled') {
            val = card.querySelector('.radio input:checked').value;
            if (val=='on') {
                if (show) {show = false};
            }
        }

        if (show) {
            card.classList.remove('hidden');
        }
        else {
            card.classList.add('hidden');
        }
        
    });
}

// live click events

document.querySelector('body').addEventListener('error',function(e){
    console.log(e);
    tag = e.target.tagName.toLowerCase();
    if (tag=='audio') {
        notify('Error - audio file not found: ' + e.target.src, 'danger');
    }
});

document.querySelector('body').addEventListener('change',function(e){
    if (e.target.classList.contains('config_volume')) {
        custom_volume = e.target.value;
        console.log('volume is now ',custom_volume);
        ach_id = e.target.dataset.id;
        console.log('for ach ',ach_id);
        sound_index = e.target.dataset.index;
        console.log('for index ',sound_index);
        ach = get_achievement(ach_id);
        ach.volumes[sound_index] = e.target.value;
        ach.sounds[sound_index].config_volume = e.target.value;
        // trigger replay with new volume scaled by global 
        /* glogal_volume = localStorage.getItem('ps2_volume');
        ach.sounds[sound_index].volume = (glogal_volume/100) * (custom_volume/100);
        ach.sounds[sound_index].pause();
        ach.sounds[sound_index].currentTime = 0;
        ach.sounds[sound_index].play(); */
        ach.play(sound_index);
        save_config();
    } 
});


function upload_audio_form(form) {
    // called by change in fileinput or submit of form
    var data = new FormData(form);
        var request = new XMLHttpRequest()
        
        request.onreadystatechange = function(){
            if(request.readyState === XMLHttpRequest.DONE) {
                var status = request.status;
                if (status === 0 || (status >= 200 && status < 400)) {
                  // The request has been completed successfully
                  response = JSON.parse(request.responseText);
                    //console.log(request.responseText);
                    if (response.success==0) {
                        notify(response.msg,'is-danger');
                    }
                    else {
                        card = form.closest('.card');
                        achievement_id = card.dataset.id;
                        var ach = null;
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
                            var url = response.url;
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
                            card_footer_entry = `
                            <div class="control">
                                <div class="tags has-addons">
                                    <span title='${url}' class="tag">${filename}</span>
                                    <a data-id='${id}' data-index='${index}' class="tag iss-light authorized_only is-primary show_volume">
                                        <i class="fas fa-volume-up"></i>
                                        <input type="range" class='config_volume' data-id='${id}' data-index='${index}' name="volume" value="90" min="0" max="100">
                                    </a>
                                    <a data-id='${id}' data-index='${index}' class="tag iss-light is-info play_sound"><i class="fas fa-play-circle"></i></span></a>
                                    <a data-id='${id}' data-index='${index}' class="remove-audio tag is-delete is-danger authorized_only"></a>
                                    
                                </div>
                                
                            </div>
                        `;
                            html = card.querySelector('.is-grouped').innerHTML;
                            html += card_footer_entry;
                            card.querySelector('.is-grouped').innerHTML = html;
                        }
                        notify(response.msg,'is-success');
                    }
                  
                } else {
                    notify("Unknown error uploading file",'is-success');
                }
            }
        }
        
        //request.open(form.method, form.action);
        request.open(form.method, "/ps2/" + window.user);
        request.send(data);
}

document.getElementById('image_display_time').addEventListener('change',function(e){
    set_notifcation_time(e.target.value);
});

document.querySelector('body').addEventListener('change',function(e){
    console.log(e.target);
    if (e.target.classList.contains('inputfile')) {
        if (e.target.value) {
            console.log('file input changed');
            var form = e.target.closest('form');
            upload_audio_form(form);
        }
    }
});
document.querySelector('body').addEventListener('submit',function(e){
    if (e.target.classList.contains('upload_audio_form')) {
        e.preventDefault();
        var form = e.target
        upload_audio_form(form);
    }
});

document.querySelector('body').addEventListener('click',function(e){

    // reset obs // obs_reset
    if (e.target.id=='obs_reset') {
        reset_obs();
    }

    // reset password / change password
    if (e.target.id=='change_password') {
        new_claim_code = prompt('Enter your new password/passphrase:');
        if (new_claim_code) {
            postAjax('', {"action":"change_password","claim_code":window.claim_code,"new_claim_code":new_claim_code}, function(data) { 
                var response = JSON.parse(data);
                console.log(response);
                if (response.success==1) {
                    notify(response.msg,'is-success');
                    window.claim_code = new_claim_code;
                    document.body.classList.add('authorized','claimed');
                    render_all_achievement_cards();
                }
                else {
                    notify(response.msg,'is-warning');
                }
            });
        }
    }

    if (e.target.id=='unlock') {
        temp_claim_code = prompt('Enter your password/passphrase:');
        postAjax('', {"action":"test_claim","claim_code":temp_claim_code}, function(data) { 
            var response = JSON.parse(data);
            console.log(response);
            if (response.success==1) {
                notify(response.msg,'is-success');
                window.claim_code = temp_claim_code;
                document.body.classList.add('authorized','claimed');
                render_all_achievement_cards();
            }
            else {
                notify(response.msg,'is-warning');
            }
        });
    }

    // hide notification if clicked
    if (e.target.classList.contains('notification') || e.target.closest('.notification')) {
        console.log('clicked notification');
        delete_me_el(e.target.closest('.notification'));
    }

    // open image manager 
    if (e.target.classList.contains('image_preview')) {
        if (document.body.classList.contains('authorized')) {
            card = e.target.closest('.card');
            ach_id = card.dataset.id;
            document.getElementById('edit_image_achievement_id').value = ach_id;
            ach = get_achievement(ach_id);
            custom_image = ach.custom_image;
            document.getElementById('custom_image_url').value = custom_image;
            document.querySelector('#edit_image_modal').classList.toggle('is-active');
        }
        else {
            alert('Must be authorized to make image changes');
        }
    }

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
            document.getElementById('group_kill_trigger_value').value = ach.group_kill_trigger_value;
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
        apply_all_filters();
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
            let sound_url = ach.soundfiles.splice(index,1)[0];
            save_config();
            e.target.closest('.control').remove();
            postAjax('', {"action":"delete_file","claim_code":window.claim_code,"sound_url":sound_url}, function(data) { 
                var response = JSON.parse(data);
                console.log(response);
                if (response.success==1) {
                    notify(response.msg,'is-success');
                    render_all_achievement_cards();
                }
                else {
                    notify(response.msg,'is-warning');
                }
            });
        }
    }

    if (e.target.classList.contains('play_sound')||e.target.closest('.play_sound')) {
        // data-id='${a.id}' data-index='${index}'
        clickedsound = e.target.closest('.play_sound');
        id = clickedsound.dataset.id;
        index = clickedsound.dataset.index;
        //console.log('playing audio id',id,' index ',index);
        ach = get_achievement(id);
        /* vel = document.querySelector('#volume'); 
        volume = vel.value;
        if (ach.volumes.length==ach.sounds.length) {
            config_volume = ach.sounds[index].config_volume;
        }
        else {
            config_volume = 100;
        }
        console.log('glogal: ',volume);
        console.log('config: ',config_volume);

        ach.sounds[index].volume = (volume/100) * (config_volume/100);
        ach.sounds[index].play(); */
        ach.play(index);
    }
    
    if (e.target.classList.contains('add_audio')||e.target.closest('.add_audio')) {
        card = e.target.closest('.card');
        achievement_id = card.dataset.id;
        //alert(achievement_id);
        url = prompt('Enter full URL of mp3/ogg file:');
        if (url!==""&&url!==null) {
            if (!url.startsWith('https')) {
                alert('Needs to be the full URL, and needs to be HTTPS');
            }
            else {
                // auto fix dropbox urls
                if (url.startsWith('https://www.dropbox.com')) {
                    url = url.replace('https://www.dropbox.com','https://dl.dropbox.com');
                    url = url.replace('?dl=0','');
                }
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
                    card_footer_entry = `
                    <div class="control">
                        <div class="tags has-addons">
                            <span title='${url}' class="tag">${filename}</span>
                            <a data-id='${id}' data-index='${index}' class="tag iss-light authorized_only is-primary show_volume">
                                <i class="fas fa-volume-up"></i>
                                <input type="range" class='config_volume' data-id='${id}' data-index='${index}' name="volume" value="90" min="0" max="100">
                            </a>
                            <a data-id='${id}' data-index='${index}' class="tag iss-light is-info play_sound"><i class="fas fa-play-circle"></i></span></a>
                            <a data-id='${id}' data-index='${index}' class="remove-audio tag is-delete is-danger authorized_only"></a>
                            
                        </div>
                        
                    </div>
                `;
                    html = card.querySelector('.is-grouped').innerHTML;
                    html += card_footer_entry;
                    card.querySelector('.is-grouped').innerHTML = html;

                    save_config();
                }
            }
        }
    }
})

