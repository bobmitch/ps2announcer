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