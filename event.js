function is_tk(event) {
    if (event.payload.event_name!='Death') {
        return false;
    }
    var attacker_loadout_id=event.payload.attacker_loadout_id;
    var victim_loadout_id=event.payload.character_loadout_id;
    if (loadouts[parseInt(attacker_loadout_id)].faction_id==loadouts[parseInt(victim_loadout_id)].faction_id) {
        return true;
    }
    else {
        return false;
    }
}

function is_death(event) {
    if (event.payload.event_name=='Death') {
        if (is_player(event.payload.character_id)) {
        //if (event.payload.character_id!=window.char) {
            return (true);
        }
    }
    return (false); 
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