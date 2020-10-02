function is_tk(event) {
    if (event.payload.event_name!='Death') {
        return false;
    }
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

