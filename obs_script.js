function display_obs_event(data) {
    console.log("OBS DISPLAY EVENT");
    console.log(event);
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
        
        var events_table = document.getElementById('obs_events');
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
            row = document.createElement('div');
            row.className += cls;
            row.classList.add('obs_row');
            row.classList.add('hideme'); // make it disappear!

            var time = document.createElement('div');
            var event = document.createElement('div'); event.classList.add('event');
            var special = document.createElement('div'); special.classList.add('special');

            time.innerHTML = nice_date(data.payload.timestamp);
            event.innerHTML = msg;

            cur_achievements.forEach(achievement_on_stack => {
                //console.log('putting pill for achievement ', achievement_on_stack);
                pills += `
                <span class='tag is-dark'>${achievement_on_stack.name}</span>
                `;
            });

            special.innerHTML = pills;

            /* setTimeout(function(){
                first_row = document.querySelector('table tr');
                first_row.parentNode.removeChild(first_row);
            },6000); */

           // row.appendChild(time);
            row.appendChild(event);
            row.appendChild(special);

            obs_events = document.getElementById('obs_events');
            obs_events.appendChild(row);
        }

    });
}

// check for player id


window.addEventListener('load', (event) => {
    if (!obs_player_id) {
        alert('No player id passed');
        window.stop();
    }
    else {
        playerlist.push ({'char_id':obs_player_id,'name':'obs'});
        setTimeout(function(){
            console.log('Player ID: ',obs_player_id);
            subscribe_to_character(obs_player_id);
        },1000);
        
        //get_player_online_state(obs_player_id);
    }
});