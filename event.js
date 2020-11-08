function is_tk(event) {
    if (event.payload.event_name=='VehicleDestroy') {
        attacker = get_local_character(event.payload.attacker_character_id);
        if (attacker) {
            if (event.payload.faction_id == attacker.faction_id ) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            console.log('unable to determine tk character for vehicle destroy',event.payload);
        }
        return false;
    }
    if (event.payload.event_name=='Death') {
        var attacker_loadout_id=event.payload.attacker_loadout_id;
        var victim_loadout_id=event.payload.character_loadout_id;
        attacker_loadout = get_loadout(parseInt(attacker_loadout_id));
        victim_loadout = get_loadout(parseInt(victim_loadout_id));
        if (!attacker_loadout || !victim_loadout) {
            // no loadout found for one or both
            // can't determine tk
            return false;
        }
        if (attacker_loadout.faction_id == victim_loadout.faction_id) {
            return true;
        }
        else {
            return false;
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
    for (var i = allevents.length - 2; i >= 0; i--) {
        // start at -2, don't include self
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

