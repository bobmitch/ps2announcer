function is_tk(event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (event.payload.team_id == event.payload.attacker_team_id) {
            return true;
        }
    }
    if (event.payload.event_name=='Death') {
        if (event.payload.team_id == event.payload.attacker_team_id) {
            return true;
        }
    }
    return false;
}

function is_death(event) {
    if (event.payload.event_name=='Death') {
        if (is_player(event.payload.character_id)) {
            return (true);
        }
    }
    return (false); 
}

function is_kill(event) {
    if (event.payload.event_name=='Death') {
        if (!is_player(event.payload.character_id)) {
            return (true);
        }
    }
    return (false);
}

function update_group_num_killed(event) {
    // checks to see if kill is part of group of kills
    cur_event_time = parseInt(event.payload.timestamp);
    event.group_num_killed = 0;
    for (var i = allevents.length - 1; i >= 0; i--) {
        // start at -1, INCLUDE self
        proc_event_time = parseInt(allevents[i].payload.timestamp);
        if (proc_event_time==cur_event_time) {
            if (allevents[i].is_kill && !allevents[i].is_tk) {
                event.group_num_killed++;
            }
        }
        else {
            // next event working backwards is not for same timestamp, exit loop
            break;
        }
    }
}

