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
        }).error(function() { data={}; data.payload={}; data.payload.timestamp = Math.floor(Date.now() / 1000); insert_row (data, 'Error getting character '+character_id+' from API'); });
        return dfd.promise();
    }
}

function get_decimator_hit_percentage_for_aeflic (char_id) {
    // http://census.daybreakgames.com/get/ps2/item?c:limit=1000&item_category_id=13&c:show=name - rocket primarys
    // https://census.daybreakgames.com/s:example/get/ps2:v2/characters_weapon_stat?character_id=5428041429986337681&item_id=84 - fire count + hit count for item
    if (!window.hasOwnProperty('aeflic_starting_deci_accuracy')) {
        window.aeflic_starting_deci_accuracy = hits/total ;
        window.aeflic_starting_deci_accuracy_session_start = last_save_date ;
        window.aeflic_session_deci_accuracy = same_as_historic;
    }
    else {
        window.aeflic_session_deci_accuracy = diff_since_last_save_hits / diff_since_last_save_total;
    }
}

function is_same_faction (char_id_1, char_id_2) {
    // can be used when both loadouts not available - eg. vehicledestroy
    char1 = get_local_character(char_id_1);
    char2 = get_local_character(char_id_2);
    if (char1 && char2) {
        return (char1.faction_id == char2.faction_id);
    }
}

function get_faction (char_id) {
    char1 = get_local_character(char_id);
    if (char1) {
        return (char.faction_id);
    }
}

function get_local_character(character_id) {
    if (!characters[character_id].hasOwnProperty('character_list')) {
        console.log ('Character ', character_id, ' has no character list array');
        return null;
    }
    if (characters[character_id].character_list.length==0) {
        console.log ('Character ', character_id, ' has empty character list array');
        return null;
    }
    return characters[character_id].character_list[0];
}

function get_local_character_stats_history(character_id) {
    char = get_local_character(character_id);
    if (!char) {
        return false;
    }
    if (char.hasOwnProperty('stats')) {
        if (char.stats.hasOwnProperty('stat_history')) {
            return char.stats.stat_history;
        }
    }
    return false;
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

function unsubscribe_from_character (id) {
    var subscription_data = {
    "action":"clearSubscribe",
		"characters":[id],
		"eventNames":[
            "Death",
            "VehicleDestroy",
            "PlayerLogin",
            "PlayerLogout",
            "GainExperience"
        ]
    };
    window.socket.send (JSON.stringify(subscription_data));
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
    //console.log('logoutonly: ',logoutonly);
    // subscribe to new char events
    if (logoutonly) {
        //console.log('Subscribing to logout events only - for: ',id);
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