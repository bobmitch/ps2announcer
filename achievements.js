
window.new_achievements = [];

window.audio_engine = {
    'last_trigger':{'priority':100},
    'last_audio':null,
    'is_playing':function(){
        if (this.last_audio) {
            return !last_audio.paused;
        }
        else {
            return false;
        }
    },
    'stop':function(){
        if (this.last_audio) {
            this.last_audio.pause();
            this.last_audio.currentTime=0;
            console.log('stopping audio ',last_audio);
        }
        else {
            console.log('no audio to stop');
        }
    },
    'priority_play':function(ach, index) {
        
        if (ach.priority < this.last_trigger.priority  || !this.is_playing()) {
            // if we have higher priority or not already playing sound at all
            // do audio engine stuff
            if (this.is_playing()) {
                console.log('we have priority! stop other audio!');
                this.stop();
            }
            this.last_trigger = ach;
            this.last_audio = ach.sounds[index];
            // play
            var playPromise = ach.sounds[index].play();
            window.last_audio = ach.sounds[index];
            if (playPromise !== undefined) {
                playPromise.then(function() {
                    // we gucci, already playing
                }).catch(function(error) {
                    console.log(error);
                    notify('Audio file not found - 404! ' +  window.last_audio.src, 'is-danger');
                });
            }
        }
        else {
            console.log('Audio for ',ach.id,' not played - too low priority');
        }
    }
}

function render_all_achievement_cards() {
    // gen achi list
    list = document.getElementById('achievments_list');
    list.innerHTML = '';
    new_achievements.forEach(a => {
        markup = render_achievement_card(a);
        list.innerHTML = list.innerHTML + markup;
    });
    apply_all_filters();
}

function get_achievment_index (ach_id) {
    for (n=0;n<new_achievements.length; n++) {
        if (new_achievements[n].id==ach_id) {
            return n;
        }
    }
    return false;
}

function js_translate(ach, prop) {
    if (ach.hasOwnProperty(prop + '_' + lang)) {
        return ach[prop+'_'+lang];
    }
    else {
        return ach[prop];
    }
}

function render_achievement_card(a) {
    friendly_name = encodeURI(a.id);
    card_footer_markup = '<div class="field is-grouped is-grouped-multiline">';
    // check to see if we have custom audio
    let has_custom = '';
    for (let [index, val] of a.soundfiles.entries()) {
        config_volume = a.volumes[index];
        if (val.startsWith('http')) {
            has_custom = ' has_custom ';
            break;
        }
    }
    for (let [index, val] of a.soundfiles.entries()) {
        config_volume = a.volumes[index];
        if (val.startsWith('http')) {
            filename = val.split('/').pop();
            card_footer_entry = `
                <div class="control">
                    <div class="tags has-addons">
                        <span title='${val}' class="tag">${filename}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag authorized_only iss-light is-primary show_volume">
                            <i class="fas fa-volume-up"></i>
                            <input type="range" class='config_volume' data-id='${a.id}' data-index='${index}' name="volume" value="${config_volume}" min="0" max="100">
                        </a>
                        <a data-id='${a.id}' data-index='${index}' class="tag iss-light is-info play_sound"><i class="fas fa-play-circle"></i></span></a>
                        <a data-id='${a.id}' data-index='${index}' class="remove-audio tag is-delete is-danger authorized_only"></a>
                        
                    </div>
                    
                </div>
            `;
        }
        else {
            // built in audio
            card_footer_entry = `
                <div class="control ${has_custom}">
                    <div class="tags has-addons">
                        <span title="Built In Audio" class="tag is-light">${val}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag iss-light authorized_only is-primary show_volume">
                            <i class="fas fa-volume-up"></i>
                            <input type="range" class='config_volume' data-index='${index}' data-id='${a.id}' name="volume" value="${config_volume}" min="0" max="100">
                        </a>
                        <a data-id='${a.id}' data-index='${index}' class="tag iss-light is-info play_sound"><i class="fas fa-play-circle"></i></a>
                        <!--<a data-id='${a.id}' data-index='${index}' class="tag iss-light is-info disable_default">on</a>-->
                    </div>
                </div>
            `;
        }
        card_footer_markup += card_footer_entry;
    };
    card_footer_markup += '</div>';
    if (a.enabled) {
        yes_checked='checked'; no_checked='';
    }
    else {
        yes_checked=''; no_checked='checked';
    }
    custom_weapon_trigger_class =' regular '
    //custom_weapon_trigger_label = "<span class='info'><button class='add_audio button is-small is-light is-success'>add audio</button></span>";
    custom_weapon_trigger_label = "";
    if (a.custom_weapon_trigger) {
        custom_weapon_trigger_class=' custom '; 
        //custom_weapon_trigger_label = '<span class="info"><button class="add_audio button is-small is-light is-success">add audio</button>&nbsp&nbsp&nbsp&nbsp<button class="button is-small edit_custom">edit custom</button>&nbsp&nbsp&nbsp&nbsp<button class="button is-small is-danger is-light delete_custom">delete</button></span> ';
        custom_weapon_trigger_label = '<span class="info"><button class="button is-small edit_custom">edit custom</button>&nbsp&nbsp&nbsp&nbsp<button class="authorized_only button is-small is-danger is-light delete_custom">delete</button></span> ';
    }
    
    let title = js_translate(a,'name');

    if (a.custom_image.includes('.mp4')) {
        image_or_video_markup = `
        <video class='image_preview' src='${a.custom_image}'/>
        `;
    }
    else {
        image_or_video_markup = `
        <img class='image_preview' src='${a.custom_image}'/>
        `;
    }

    markup = `
    <div class="${no_checked} card ${custom_weapon_trigger_class}" data-id="${a.id}">
        <header class="card-header">
            <p class="card-header-title">
            ${title} ${custom_weapon_trigger_label}
            </p>
            <div class='control>
                <a class='image_preview_wrap' href='#'>
                    ${image_or_video_markup}
                </a>
            </div>
            <div class="control authorized_only">
                <label class="radio ">
                    <input ${yes_checked} value="on" type="radio" class="audio_enabled_radio" name="enabled_${friendly_name}">
                    On
                </label>
                <label class="radio">
                    <input ${no_checked} value="off" type="radio" class="audio_enabled_radio" name="enabled_${friendly_name}">
                    Off
                </label>
            </div>
        </header>
        <div class="card-content">
            <div class="content">
                ${a.description}
                
            </div>
        </div>
        <footer class='card-footer'>
            ${card_footer_markup}
            <form class='upload_audio_form' action="/ps2/foo" method="post" enctype="multipart/form-data">
                <input type="hidden" value="${window.user}" name="user"/>
                <input type="hidden" value="${window.claim_code}" name="claim_code"/>
                <input type="hidden" value="upload_audio" name="action"/>
                <label class='audio_upload_label' for="inputfile_${friendly_name}" ><i class="fas fa-cloud-upload-alt"></i> Upload file</label>
                <input id="inputfile_${friendly_name}" class='inputfile' type="file" name="audiofile">
            </form>
            <button title="Add Custom Audio File" style='margin:1em' class='authorized_only myian_only add_audio button is-small iss-light is-success'><i class="fas fa-plus"></i></button>
        </footer>
    </div>
    `;
    return markup;
}


function Achievement(id, name, description, trigger, soundfiles=['ting.mp3'], priority=10, interruptable=false) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.soundfiles = soundfiles;
    this.sounds = [];
    this.volumes = [];
    this.soundfiles.forEach(s => {
        this.volumes.push(100);
    });
    this.priority=priority;
    this.interruptable = interruptable;
    this.enabled = true;
    this.custom_image = "images/noimage.png";
    this.text_in_killboard = false;
    this.custom_weapon_trigger = null;
    if (trigger) {
        this.triggered = trigger;
    }
    window.new_achievements.push(this);
};

Achievement.prototype.triggered = function() {
    // return true or false
    return false;
};

Achievement.prototype.play = function(index=false) {
    var glogal_volume = document.getElementById('volume').value;
    if (!index) {
        index = Math.floor(Math.random() * this.sounds.length);
    }
    
    //if (!this.sounds[index].hasOwnProperty('config_volume') || !this.sounds[index].config_volume) {
    if (!this.sounds[index].hasOwnProperty('config_volume') || !this.sounds[index].config_volume) {
        this.sounds[index].config_volume=100;
    }
    //console.log('glogal: ',glogal_volume);
    //console.log('config_volume',this.sounds[index].config_volume);
    this.sounds[index].volume = (glogal_volume/100) * (this.sounds[index].config_volume/100) ;

    audio_engine.priority_play(this, index);

    /* var playPromise = this.sounds[index].play();
    window.last_audio = this.sounds[index];
    if (playPromise !== undefined) {
        playPromise.then(function() {
            // we gucci, already playing
        }).catch(function(error) {
            console.log(error);
            notify('Audio file not found - 404! ' +  window.last_audio.src, 'is-danger');
        });
    } */
}

Achievement.prototype.trigger = function(notification_only) {
    /* console.log ('Triggered achievement:');
    console.log (this); */
    vel = document.querySelector('#volume'); 
    volume = vel.value;
    has_external = false;
    if (!notification_only) {
        for (n=0; n<this.sounds.length; n++) {
            //if (!this.sounds[n].src.includes('bobmitch.com')) {
            if (this.soundfiles[n].includes('https')) {
                has_external=true;
            }
        }
        if (this.sounds.length==0) {
            say(this.name);
        }
        else if (!has_external) {
            // default only
            /* random_sound_index = Math.floor(Math.random() * this.sounds.length);
            this.sounds[random_sound_index].volume = (volume/100) * (this.sounds[random_sound_index].config_volume/100) ;
            this.sounds[random_sound_index].play(); */
            random_sound_index = Math.floor(Math.random() * this.sounds.length);
            this.play(random_sound_index);
        }
        else {
            // pick random until external found
            random_sound_index = Math.floor(Math.random() * this.sounds.length);
            //while (this.sounds[random_sound_index].src.includes('bobmitch.com')) {
            while (!this.soundfiles[random_sound_index].includes('https')) {
                random_sound_index = Math.floor(Math.random() * this.sounds.length);
            }
            /* this.sounds[random_sound_index].volume = (volume/100) * (this.sounds[random_sound_index].config_volume/100) ;
            this.sounds[random_sound_index].play(); */
            this.play(random_sound_index);
        }
    }
    if (this.hasOwnProperty('custom_image')) {
        if (this.custom_image!='' && this.custom_image!=null) {
            if (this.custom_image.includes('noimage.png')) {
                //notify( this.name + '&nbsp' + this.description,'achievement_notification');
                
                return false; // make true for testing with noimage image
            }
            else {
                if (this.custom_image.includes('.mp4')) {
                    notify('<video loop autoplay><source type="video/mp4"  src="' + this.custom_image + '"></video>','custom_image_notification');
                }
                else {
                    notify('<img src="' + this.custom_image + '">','custom_image_notification');
                }
                return false; // make true for testing with noimage image
            }
        }
    }
    if (this.hasOwnProperty.text_in_killboard) {
        if (this.text_in_killboard==true) {
            insert_row (null, this.description);
        }
    }
};

// define achievments


//
var roadkill = new Achievement('roadkill','Roadkill!','Squished someone with a ground vehicle!', function (event) {
    // latest event is current
    var l = window.allevents.length;
    if (event.is_kill) {
        if (!event.is_tk) {
            if (event.payload.attacker_weapon_id=="0") {
                if (event.payload.attacker_vehicle_id!="0") {
                    vh = get_local_vehicle (event.payload.attacker_vehicle_id);
                    if (vh.type_name=="Four Wheeled Ground Vehicle") {
                        return true;
                    }
                }
            }
        }
    }
    return false;
},['roadkill.mp3'],3);
roadkill.name_ru = "дорожное убийство";

var revenge = new Achievement('revenge','Revenge!','Killed someone who killed you before!', function (event) {
    // latest event is current
    char = get_local_character(event.payload.character_id);
    if (event.is_kill && !event.is_tk) {
        if (char.primed_for_revenge) {
            insert_row (null, "You got revenge by killing " + char.name.first);
            char.primed_for_revenge=false;
            return true;
        }
    }
    return false;
},['Just Pout.ogg'],9);

// https://dl.dropbox.com/s/l8ko7l9c7rxuh7m/payback%27s-a-bitch-ain%27t-it.mp3

var antiair = new Achievement('antiair','Clear Skies!','Killed an aircraft!', function (event) {
    /* if (topgun.triggered(event)) {
        return false; // don't trigger if topgun already triggered...
    } */
    if (is_player(event.payload.attacker_character_id)) {
        if (event.payload.event_name=='VehicleDestroy') {
            if (is_player(event.payload.character_id)) {
                // don't trigger if it's your own aircraft - even if this is technically correct
                return false;
            }
            if (event.is_tk) {
                // killed friendly, not good
                return false;
            }
            var destroyed_vehicle = get_local_vehicle(event.payload.vehicle_id);
            console.log(event);
            console.log('checking if you destroyed a light aircraft:');
            console.log(destroyed_vehicle); 
            if (destroyed_vehicle) {
                if (destroyed_vehicle.type_name=="Light Aircraft") {
                    return true;
                }
            }
        }
    }
    return false;
},['land_your_plane.mp3','crash_and_burn_mav.mp3','keep-the-skies-clear.mp3','flying_dying.mp3'],10);

var topgun = new Achievement('topgun','Top Gun!','Destroyed an ESF with an ESF!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (is_player(event.payload.attacker_character_id) && !is_player(event.payload.character_id)) {
            // killed a vehicle, not your own
            if (event.is_tk) {
                // tks don't count
                return false;
            }
            if (is_esf(event.payload.vehicle_id) && is_esf(event.payload.attacker_vehicle_id)) {
                // killed an esf while in your esf
                return true;
            }
        }
    }
    return false;
},['congrats_top_gun.mp3','im_a_pilot.mp3','planes_no_place_for_boys.mp3'],4);

var airfarmed = new Achievement('airfarmed','Airfarmed!','Killed by an ESF!', function (event) {
    if (event.payload.event_name=='Death') {
        if (is_player(event.payload.character_id) && !is_player(event.payload.attacker_character_id)) {
            // killed by a vehicle, not your own
            if (event.is_tk) {
                // tks don't count
                return false;
            }
            if (is_esf(event.payload.attacker_vehicle_id)) {
                // killed by an esf
                if (event.payload.vehicle_id=="0") {
                    return true;
                }
            }
        }
    }
    return false;
},['im_a_pilot.mp3'],18);


var ragequit = new Achievement('ragequit','Ragequit!','You killed someone who left almost straight away!', function (event) {
    if (event.payload.event_name=="PlayerLogout") {
        console.log('Potential ragequit - check against ragequit_watchlist list for ', event);
        if (ragequit_watchlist.hasOwnProperty(event.payload.character_id)) {
            time_since_added_to_list = parseInt(event.payload.timestamp) - parseInt(ragequit_watchlist[event.payload.character_id]);
            console.log ('Watchlist - time since added is ',time_since_added_to_list);
            if (time_since_added_to_list>15) {
                // they were on the list, but they are still playing, so remove from list
                unsubscribe(event.payload.character_id);
                delete ragequit_watchlist[event.payload.character_id];
            }
            else {
                return true;
            }
        }
        // clear all old ragequit subscriptions and watches
        for (const potential_rager in ragequit_watchlist) {
            //console.log(`${potential_rager}: ${ragequit_watchlist[potential_rager]}`);
            time_since_added_to_list = parseInt(event.payload.timestamp) - parseInt(ragequit_watchlist[potential_rager]);
            if (time_since_added_to_list>15) {
                unsubscribe(potential_rager);
                delete ragequit_watchlist[potential_rager];
            }
        }
    }
    return false;
},['solong.mp3'],5);

var pentakill = new Achievement('pentakill','PentaKill!','5 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==5) {
            insert_row (event, "5 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['farming.mp3'],4);

var decakill = new Achievement('decakill','DecaKill!','10 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==10) {
            insert_row (event, "10 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['No One Could have Survived.ogg'],4);

var decakill2 = new Achievement('decakill2','20 in a row!','20 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==20) {
            insert_row (event, "20 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['twenty-real-lemmons.mp3'],1);

var decakill3 = new Achievement('decakill3','30 in a row!!','30 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==30) {
            insert_row (event, "30 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['relentless.mp3'],1);

var decakill4 = new Achievement('decakill4','40 in a row!!','40 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==40) {
            insert_row (event, "40 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['how-do-you-kill-a-god.mp3'],1);

var decakill5 = new Achievement('decakill5','50 in a row!!','50 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==50) {
            insert_row (event, "50 Kills In A Row!");
            return (true);
        }
    }
    return false;
},['he-was-like-a-god-walking-amongst-mere-mortals.mp3'],1);

var streakend = new Achievement('streakend','Oh.','Your impressive streak came to an end!', function (event) {
    /* console.log('checking streakend:');
    console.log('is death: ',event.is_death);
    console.log('killstreak',killstreak);
    console.log('multikills:',multikills); */
    if (event.is_death && (killstreak_was>4 || multikills_was>1)) {
        return (true);
    }
    return false;
},['oh-no.mp3','sad_crowd.mp3','crowd-scream-no_M1xhZ_Nd_NWM.mp3','this-is-it-this-is-how-it-ends-this-is-how-shake-and-bake-ends.mp3'],1); 

var doublekill = new Achievement('doublekill','Double Kill!','2 kills in quick succession!', function (event) {
    //console.log('checking for double kill - current multikills = ',multikills);
    if (event.is_kill && !event.is_tk) {
        //console.log('...you got a kill... checking multikills count==2....');
        if (multikills==1) {
            return (true);
        }
    }
    return false;
},['two.mp3'],6);  
var triplekill = new Achievement('triplekill','Triple Kill!','3 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==2) {
            return (true);
        }
    }
    return false;
},['three.mp3'],5);
var multikill = new Achievement('multikill','Multi Kill!','4 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==3) {
            return (true);
        }
    }
    return false;
},['four.mp3'],4);
var megakill = new Achievement('megakill','Mega Kill!','5 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==4) {
            return (true);
        }
    }
    return false;
},['five_long.mp3'],3);
var ultrakill = new Achievement('ultrakill','Ultra Kill!','6 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==5) {
            return (true);
        }
    }
    return false;
},['six.mp3'],3);
var monsterkill = new Achievement('monsterkill','Monster Kill!','7 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==6) {
            return (true);
        }
    }
    return false;
},['seven.mp3'],3);
var ludicrous = new Achievement('ludicrous','Ludicrous Kill!','8 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==7) {
            return (true);
        }
    }
    return false;
},['count_laughing.mp3'],3);
var holyshit = new Achievement('holyshit','Holy Shit!','9 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==8) {
            return (true);
        }
    }
    return false;
},['nine.mp3'],3);



var sneaker_kill = new Achievement('sneaker','Sneaker!','You killed an invisible pussy!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (event.payload.character_loadout_id=='1' || event.payload.character_loadout_id=='8' || event.payload.character_loadout_id=='15'|| event.payload.character_loadout_id=='27') {
            // 1,8.15,190 = infil loadouts - 190 = ns - could be 15+7
            // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
            return true;
        }
    }
    return false;
},['Low Profile.ogg'],19);

var sneaker_death = new Achievement('sneakerdeath','Long Range Wanker!','You were killed by an invisible bastard!', function (event) {
    if (event.is_death && !event.is_tk) {
        if (event.payload.attacker_loadout_id=='1' || event.payload.attacker_loadout_id=='8' || event.payload.attacker_loadout_id=='15'|| event.payload.attacker_loadout_id=='27') {
            // 1,8.15,190 = infil loadouts - 190 = ns - could be 15+7
            // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
            return true;
        }
    }
    return false;
},['invisibleman.mp3'],8);


var max_kill = new Achievement('minmax','Min Max!','You killed a tiny brain person in a really big suit!', function (event) {
    if (!event.is_kill) {
        return false;
    }
    if (event.is_tk) {
        return false;
    }
    if (event.payload.character_loadout_id=='7' || event.payload.character_loadout_id=='14' || event.payload.character_loadout_id=='21'|| event.payload.character_loadout_id=='33') {
        // max loadouts - THINK 33 is ns max, not 100% sure - could be 28
        // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
        return true;
    }
},['max-here-boy.mp3','embarass-max.mp3'],3);

var headshot_ach = new Achievement('headshot','Headshot!','You got a headshot kill!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (event.payload.is_headshot=='1') {
            return (true);
        }
    }
    return false;
},['pew.mp3'],10);
headshot_ach.custom_image = 'images/headshot.png'; // example image

var accuracy = new Achievement('accuracy','Accuracy!','5 headshots in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (headshotstreak>0 && headshotstreak%5==0) {
            return true;
        }
    }
    return false;
},['betweeneyes.mp3'],6);
accuracy.text_in_killboard = true;

var nocar = new Achievement('nocar',"Dude, where's my car?",'You killed a harasser!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (event.is_tk) {
            return false;
        }
        if (is_player(event.payload.attacker_character_id)) {
            vh = get_local_vehicle(event.payload.vehicle_id);
            if (vh) {
                if (vh.name.en=="Harasser") {
                    return (true);
                }
            }
        }
    }
    return false;
},['VOLUME_Dude wheres my car.wav'],20);

var pizzadelivery = new Achievement('pizzadelivery',"Pizza Delivery",'Killed a vehicle with tank mine!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (is_player(event.payload.attacker_character_id) && !event.is_tk) {
            if (event.payload.weapon_id=='650'||event.payload.weapon_id=='6005962'||event.payload.weapon_id=='6005961') {
                return true;
            }
        }
    }
    return false;
},['pizza.mp3'],5);

var norobots = new Achievement('norobots',"Kill The Toasters!",'You killed a spitfire turret!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
        if (is_player(event.payload.attacker_character_id)) {
            vh = get_local_vehicle(event.payload.vehicle_id);
            if (vh) {
                if (vh.name.en=="Spitfire Auto-Turret"||vh.name.en=="AA SpitFire Turret") {
                    return (true);
                }
            }
        }
    }
    return false;
},['wallescream.mp3','antispitty1.mp3','badrobot.mp3']);

var killed_by_shotgun = new Achievement('redmist','Red Mist!','You got killed by a shotgun!', function (event) {
    
    if (!event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Shotgun") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['rudeness.mp3','bus-driver-crap.mp3'],9);

var grenade_kill = new Achievement('kobe','Kobe!','Pinpoint throw - got a grenade kill!', function (event) {
    if (event.is_tk) {
        return false;
    }
    if (event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Grenade") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['kobe.mp3']);



// {
var c4mess = new Achievement('c4mess','C-4 Galore!','Got 3+ kills with single C-4!', function (event) {
    if (event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        if (event.payload.attacker_weapon_id=='432'||event.payload.attacker_weapon_id=='800623') {
            if (window.c4counter.hasOwnProperty(event.payload.timestamp)) {
                if (window.c4counter[event.payload.timestamp]>2) {
                    return true;
                }
            }
        }
    }
    return false;
},['bigboom.mp3'],3);

var mozzie = new Achievement('mozzie','Blood Sucker!','You got killed by a Mosquito Banshee!', function (event) {
    if (!event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            if (weapon.item_id=="4906") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['rudeness.mp3','bus-driver-crap.mp3'],4);

var shotgun_shogun = new Achievement('shotgun_shogun','Shotgun Shogun!','3 shotgun kills in a row, within 5 seconds of each other!', function (event) {
    if (event.is_tk) {
        return false;
    }
    if (event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Shotgun") {
                if (shotgun_killstreak%3==0 && shotgun_killstreak>0) {
                    return true;
                }
            }
        }
    }
    return false;
},['shotgun.mp3']);

var rocketman = new Achievement('rocketman','Rocket Man!','You killed someone with a rocket!', function (event) {
    
    if (event.is_kill) {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Rocket Launcher") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['rocket-man.mp3'],4);


var knifey = new Achievement('knifey','Knifey Spooney!','You stabbed a motherfucker!', function (event) {
    
    if (event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        //weapon = weapons[event.payload.attacker_weapon_id];
        weapon = get_local_weapon(event.payload.attacker_weapon_id);
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Knife") {
                return true;
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['stabbing_motion.mp3','do-knife-thing.mp3']);

var knife3 = new Achievement('knife3','Knife Killstreak!','3 Knife Kills Without Dying!', function (event) {
    
    if (!event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=="0") {
            return false;
        }
        weapon = weapons[event.payload.attacker_weapon_id];
        if (weapon) {
            type = get_weapon_type (weapon.item_category_id);
            if (type=="Knife") {
                if (window.knife_killstreak==3) {
                    return true;
                }
            }
        }
        else {
            console.log('unknown weapon for event',event);
        }
    }
    return false;
},['cutcutcut.mp3']);


var badspam = new Achievement('badspam',"I Don't Like Spam!",'You got killed by a Lasher!', function (event) {
    if (!event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=='7540') {
            return true;
        }
    }
    return false;
},['spam1.mp3','spam2.mp3','spam3.mp3']);

var goodspam = new Achievement('goodspam','Good Spam!','You spammed 5 people to death with the Lasher!', function (event) {
    if (event.is_kill && event.payload.event_name=="Death") {
        if (event.payload.attacker_weapon_id=='7540') {
            spamstreak++;
            if (spamstreak>0 && spamstreak%5==0) {
                return true;
            }
        }
        else {
            spamstreak=0;
        }
    }
    return false;
},['goodspam.mp3']);

var reviver = new Achievement('revive','Reviver!','You revived three times in a row!', function (event) {
    if (event.payload.event_name=="GainExperience" && is_player(event.payload.character_id)) {
        // 7 = revive, 57 = squad revive
        if (event.payload.experience_id=='7' || event.payload.experience_id=='53' ) {
            //window.revive_count_streak++;
            if (window.revive_count_streak>0 && window.revive_count_streak%3==0) {
                return true;
            }
        }
    }
    return false;
},['xp.mp3','Bwup!.ogg'],20);

var badres = new Achievement('badres','Bad Rez!','That was a bad rez!', function (event) {
    if (event.is_death) {
        // 7 = revive, 57 = squad revive
        var death_time_int = parseInt(event.payload.timestamp);
        var last_res_time_int = parseInt(window.last_res_timestamp);
        var time_since_last_res = death_time_int-last_res_time_int;
        if (time_since_last_res>0 && time_since_last_res<5) {
            insert_row (event, "You should have stayed down...");
            return true;
        }
    }
    return false;
},['risky.mp3'],5);

var nobeacon = new Achievement('nobeacon','Light The Beacons!','You killed a beacon - just leave the sundies alone!', function (event) {
    if (event.payload.event_name=="GainExperience" && is_player(event.payload.character_id)) {
        // 7 = revive, 57 = squad revive
        if (event.payload.experience_id=='270') {
            return true;
        }
    }
    return false;
},["wheres-the-damn-beacon-oh-i-see-it.mp3"],20);
nobeacon.text_in_killboard = true;

var repeat = new Achievement('repeatcustomer','Repeat Customer x 3!','You killed the same person 3 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        char = get_local_character(event.payload.character_id);
        if (char.killstreak==3) {
            insert_row (null, 'You killed ' + char.name.first + ' 3 times!');
            return true;
        }
    }
    return false;
},['Whats Up_ Whattya been doin_.ogg'],9);

var learn = new Achievement('learn','Repeat Customer x 4!','You killed the same person 4 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.killstreak==4) {
        insert_row (null, 'You killed ' + char.name.first + ' 4 times!');
           return true;
       }
    }
    return false;
},['seeyouagainchancho.mp3'],9);
learn.text_in_killboard = true;

var domination = new Achievement('domination','Repeat Customer x 5!','You killed the same person 5 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.killstreak==5) {
            insert_row (null, 'You killed ' + char.name.first + ' 5 times!');
           return true;
       }
    }
    return false;
},['seeyouagain.mp3'],9);

var recursion = new Achievement('recursion','Repeat Customer x 6!','You killed the same person 6 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.killstreak==6) {
        insert_row (null, 'You killed ' + char.name.first + ' 6 times!');
           return true;
       }
    }
    return false;
},['seeyouagainmancub.mp3'],8);

var recursionrecursion = new Achievement('recursionrecursion','Repeat Customer x 10!','You killed the same person 10 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.killstreak==6) {
        insert_row (null, 'You killed ' + char.name.first + ' 10 times!');
           return true;
       }
    }
    return false;
},['embarassing.mp3'],5);

var nemesis = new Achievement('nemesis','Nemesis!','You were killed by the same person more than 3 times!', function (event) {
    if (event.is_death && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.deathstreak>2) {
            insert_row (null, 'You were killed by ' + char.name.first + ' ' + char.deathstreak.toString() + ' times!');
           return true;
       }
    }
    return false;
},['crowd-scream-no_M1xhZ_Nd_NWM.mp3'],15);

var spraypray = new Achievement('spraypray','Spray & Pray!','You killed 5 people in a row with body shots!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (window.bodyshotkillstreak>0 && window.bodyshotkillstreak%5==0) {
            return true;
        }
    }
    return false;
},["that's-not-entirely-accurate.mp3"],15);

var assister = new Achievement('helper','Santas Little Helper!','You assisted killing someone 5 times in a row without killing anybody yourself!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 2 assist, 371 priority assist
        if (event.payload.experience_id=='2' || event.payload.experience_id=='371') {
            assist_streak++;
            if (assist_streak%5==0 && assist_streak>0) {
                var msg = "You are Santa's Little Helper! 5 assists in a row without any kills yourself!";
                insert_row (event, msg);
                return true;
            }
        }
    }
    return false;
},['helper.mp3'],5);

var blinder = new Achievement('blinder','Blinded, With Science!','You blinded someone by killing their motion spotter!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 293 motion detect, 370 kill motion spotter, 294 squad motion detect
        if ( (event.payload.experience_id=='370') ) {
            //console.log(event);
            //console.log ('Triggered stevie wonder:');
            var msg = "You blinded the enemy!";
            //msg += print_character(event.payload.other_id);
            insert_row (event, msg);
            return true;
        }
    }
    return false;
},['SheBlindedMe.mp3']);


var hatebombs = new Achievement('hatebombs','Bomb Disposal!','You killed someones explosive device!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 293 motion detect, 370 kill motion spotter, 294 squad motion detect
        if ( (event.payload.experience_id=='86')) {
            //console.log(event);
            //console.log ('Triggered bomb disposal:');
            var msg = "You defused the situation!";
            //msg += print_character(event.payload.other_id);
            insert_row (event, msg);
            return true;
        }
    }
    return false;
},['mine_long.mp3']);

var teamkill = new Achievement('teamkill','Teamkill!','You killed a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (event.is_kill && event.is_tk) {
            return true;
        }
    }
    return false;
},['My Bad! Thats on me.ogg','count_sorry.mp3','no_friends_count.mp3']);

var badteamkill = new Achievement('badteamkill','Blue on blue!','You were killed by a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (!event.is_kill && event.is_tk) {
            return true;
        }
    }
    return false;
},['To a Zone... one of Danger.ogg']);

var welcome = new Achievement('welcome','Welcome To Planetside!','You killed someone new to the game!', function (event) {
    if (event.payload.event_name=="Death") {
        if (event.is_kill && !event.is_tk) {
            char = get_local_character(event.payload.character_id);
            if (!char) {
                return false;
            }
            else if (char.battle_rank.value < 6) {
                return true;
            }
        }
    }
    return false;
},['Prospective Investor.ogg']);


var shitter = new Achievement('shitter','Shitter Dunk!','You killed someone with a good KDR!', function (event) {
    if (event.payload.event_name=="Death") {
        if (event.is_kill && !event.is_tk) {
            stats_history = get_local_character_stats_history(event.payload.character_id);
            if (stats_history) {
                victim_kdr = (parseInt(stats_history[5].all_time) / parseInt(stats_history[2].all_time)).toFixed(2);
            }
            else {
                victim_kdr = 0;
            }
            if (victim_kdr>2.5) {
                return true;
            }
        }
    }
    return false;
},['Just Pout.ogg','PAM - yeehhh, sploosh.ogg'],7);

var mutual = new Achievement('mutual','Mutually Assured Destruction!','You killed another player at the same time as he killed you!', function (event) {
    if (event.payload.event_name=="Death") {
        if (event.is_kill && !event.is_tk && allevents.length>=2) {
            // your kill, check previous event for death at same time
            prev = allevents[allevents.length-2];
            if (prev.payload.timestamp==event.payload.timestamp) {
                //console.log('you killed - mutual test - same timestamp for ',event, ' and ',prev);
                // same time
                if (prev.payload.event_name=="Death" && is_player (prev.payload.character_id)) {
                    // you died prev
                    if (prev.payload.attacker_character_id==event.payload.character_id) {
                        // to the same guy you killed
                        return true;
                    }
                }
            }
        }
        if (!event.is_kill && !event.is_tk && allevents.length>=2) {
            // you died, check for a kill prev event
            prev = allevents[allevents.length-2];
            if (prev.payload.timestamp==event.payload.timestamp) {
                //console.log('you died - mutual test - same timestamp for ',event, ' and ',prev);
                // same time
                if (prev.payload.event_name=="Death" && is_player (prev.payload.attacker_character_id)) {
                    // you killed in prev
                    if (!is_tk(prev)) {
                        if (prev.payload.character_id==event.payload.attacker_character_id) {
                            // and it was the same dude that killed you...
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false;
},['aallrighty.mp3'],4);

var spitty = new Achievement('spitty','Lazy!','Spitfire Turret Got The Kill!', function (event) {
    if (event.is_kill) {
        if (!event.is_tk) {
            /* if (event.payload.attacker_weapon_id=="0") {
                if (event.payload.attacker_vehicle_id!="0") {
                    vh = get_local_vehicle (event.payload.attacker_vehicle_id);
                    if (vh.type_name.includes("Spitfire")) {
                        return true;
                    }
                }
            } */
            // 802514, 802517, 802518
            if (event.payload.attacker_weapon_id=='802514'||event.payload.attacker_weapon_id=='802517'||event.payload.attacker_weapon_id=='802518') {
                return true;
            }
        }
    }
    return false;
},['spitfire.mp3','machine-survive.mp3'],3);

// end of define achievments

// replace sound filenames in achievements with actual audio elements
new_achievements.forEach(achievement => {
    if (achievement.hasOwnProperty('soundfiles')) {
        for (n=0; n<achievement.soundfiles.length; n++) {
            if (achievement.soundfiles[n].toLowerCase().startsWith('http')) {
                // external mp3
                achievement.sounds[n] = new Audio(achievement.soundfiles[n]);
            }
            else {
                achievement.sounds[n] = new Audio('https://bobmitch.com/ps2/audio/' + achievement.soundfiles[n]);
            }
            achievement.sounds[n].crossOrigin = 'anonymous';
        }
    }
});

var normalkill = new Achievement('normalkill','Vanilla Kill!','Just a good old fashioned kill!', function (event) {
    // latest event is current
    var l = window.allevents.length;
    if (event.is_kill) {
        if (!event.is_tk) {
            return true;
        }
    }
    return false;
},[],20);
normalkill.enabled=false;

var sixdeaths = new Achievement('sixdeaths','Six Deaths!','6 deaths in a row!', function (event) {
    if (event.is_death) {
        if (deathstreak==6) {
            insert_row (event, "6 Deaths In A Row!");
            return (true);
        }
    }
    return false;
},['mr-mackey-umkay.mp3'],15);

var sevendeaths = new Achievement('sevendeaths','Seven Or More Deaths!','7 or more deaths in a row!', function (event) {
    if (event.is_death) {
        if (deathstreak>6) {
            insert_row (event, deathstreak.toString() + " Deaths In A Row!");
            return (true);
        }
    }
    return false;
},['oh-no.mp3'],15);

// 38:53 clutch vod 11/7 for debug
var suicidebomber = new Achievement('suicidebomber','Sacrificial Lamb!','You sacrificed yourself for the greater good, killing a vehicle while dying!', function (event) {
    if (last_suicide_death_timestamp==last_vehicle_kill_timestamp) {
        if (event.payload.timestamp==last_suicide_death_timestamp) {
            // you killed enemy vehicle and died at same time
            // reset timestamps to prevent multiple triggers
            last_vehicle_kill_timestamp = -999;
            return (true);
        }
    }
    return false;
},[],2);