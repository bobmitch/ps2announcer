
window.new_achievements = [];

function render_all_achievement_cards() {
    // gen achi list
    list = document.getElementById('achievments_list');
    list.innerHTML = '';
    new_achievements.forEach(a => {
        markup = render_achievement_card(a);
        list.innerHTML = list.innerHTML + markup;
    });
}

function get_achievment_index (ach_id) {
    for (n=0;n<new_achievements.length; n++) {
        if (new_achievements[n].id==ach_id) {
            return n;
        }
    }
    return false;
}

function render_achievement_card(a) {
    friendly_name = encodeURI(a.id);
    card_footer_markup = '<div class="field is-grouped is-grouped-multiline">';
    
    for (let [index, val] of a.soundfiles.entries()) {
        config_volume = a.volumes[index];
        if (val.startsWith('http')) {
            filename = val.split('/').pop();
            card_footer_entry = `
                <div class="control">
                    <div class="tags has-addons">
                        <span title='${val}' class="tag">${filename}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag iss-light is-primary show_volume">
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
                <div class="control">
                    <div class="tags has-addons">
                        <span title="Built In Audio" class="tag is-light">${val}</span>
                        <a data-id='${a.id}' data-index='${index}' class="tag iss-light is-primary show_volume">
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
    
    markup = `
    <div class="card ${custom_weapon_trigger_class}" data-id="${a.id}">
        <header class="card-header">
            <p class="card-header-title">
            ${a.name} ${custom_weapon_trigger_label}
            </p>
            <div class='control>
                <a class='image_preview_wrap' href='#'>
                    <img class='image_preview' src='${a.custom_image}'/>
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
            <button style='margin:1em' class='authorized_only add_audio button is-small iss-light is-success'><i class="fas fa-plus"></i></button>
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
    this.priority=priority;
    this.interruptable = interruptable;
    this.enabled = true;
    this.custom_image = "images/noimage.png";
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

Achievement.prototype.trigger = function(notification_only) {
    /* console.log ('Triggered achievement:');
    console.log (this); */
    vel = document.querySelector('#volume'); 
    volume = vel.value;
    has_external = false;
    if (!notification_only) {
        for (n=0; n<this.sounds.length; n++) {
            if (!this.sounds[n].src.includes('bobmitch.com')) {
                has_external=true;
            }
        }
        if (this.sounds.length==0) {
            say(this.name);
        }
        else if (!has_external) {
            // default only
            random_sound_index = Math.floor(Math.random() * this.sounds.length);
            this.sounds[random_sound_index].volume = (volume/100) * (this.sounds[random_sound_index].config_volume/100) ;
            this.sounds[random_sound_index].play();
        }
        else {
            // pick random until external found
            random_sound_index = Math.floor(Math.random() * this.sounds.length);
            while (this.sounds[random_sound_index].src.includes('bobmitch.com')) {
                random_sound_index = Math.floor(Math.random() * this.sounds.length);
            }
            this.sounds[random_sound_index].volume = (volume/100) * (this.sounds[random_sound_index].config_volume/100) ;
            this.sounds[random_sound_index].play();
        }
    }
    if (this.hasOwnProperty('custom_image')) {
        if (this.custom_image!='' && this.custom_image!=null) {
            if (this.custom_image.includes('noimage.png')) {
                notify( this.name + '&nbsp' + this.description,'achievement_notification');
                return false; // make true for testing with noimage image
            }
            else {
                notify('<img src="' + this.custom_image + '">','custom_image_notification');
                return false; // make true for testing with noimage image
            }
            anim_id = 'animation' + '_' + this.id ;
            anim = document.getElementById(anim_id);
            if (!anim) {
                animation_container = document.getElementById('animations');
                anim = document.createElement('div');
                anim.classList.add('animation');
                anim.id = anim_id;
                img = document.createElement('img');
                img.classList.add('animation_image');
                img.src = this.custom_image;
                anim.appendChild(img);
                animation_container.appendChild(anim);
            }
            // make sure src is up to date
            if (img.src != this.custom_image) {
                img.src = this.custom_image;
            }
            // remove class, clone and replace to trigger
            // see: https://css-tricks.com/restart-css-animation/
            anim.classList.remove('showanimation');
            var newone = anim.cloneNode(true);
            anim.parentNode.replaceChild(newone, anim);
            newone.classList.add('showanimation');
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
},['roadkill.mp3'],15);

var revenge = new Achievement('revenge','Revenge!','Killed someone who killed you before!', function (event) {
    // latest event is current
    char = get_local_character(event.payload.character_id);
    if (event.is_kill && !event.is_tk) {
        if (char.is_primed_for_revenge) {
            char.is_primed_for_revenge=false;
            return true;
        }
    }
    return false;
},['Just Pout.ogg'],15);

// https://dl.dropbox.com/s/l8ko7l9c7rxuh7m/payback%27s-a-bitch-ain%27t-it.mp3

var antiair = new Achievement('antiair','Clear Skies!','Killed an aircraft!', function (event) {
    if (is_player(event.payload.attacker_character_id)) {
        if (event.payload.event_name=='VehicleDestroy') {
            if (is_player(event.payload.attacker_character_id)) {
                // you killed it
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

var decikills = new Achievement('pentakill','PentaKill!','5 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==5) {
            return (true);
        }
    }
    return false;
},['farming.mp3'],4);

var decakills = new Achievement('decakill','DecaKill!','10 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==10) {
            return (true);
        }
    }
    return false;
},['No One Could have Survived.ogg'],4);

var decakills2 = new Achievement('decakill2','20 in a row!','20 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==20) {
            return (true);
        }
    }
    return false;
},['twenty-real-lemmons.mp3'],1);

var decakills3 = new Achievement('decakill3','30 in a row!!','30 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==30) {
            return (true);
        }
    }
    return false;
},['relentless.mp3'],1);

var decakills4 = new Achievement('decakill4','40 in a row!!','40 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==40) {
            return (true);
        }
    }
    return false;
},['how-do-you-kill-a-god.mp3'],1);

var decakills5 = new Achievement('decakill5','50 in a row!!','50 unanswered kills in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (killstreak==50) {
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
},['oh-no.mp3','sad_crowd.mp3','crowd-scream-no_M1xhZ_Nd_NWM.mp3','this-is-it-this-is-how-it-ends-this-is-how-shake-and-bake-ends.mp3'],5); 

var doublekill = new Achievement('doublekill','Double Kill!','2 kills in quick succession!', function (event) {
    //console.log('checking for double kill - current multikills = ',multikills);
    if (event.is_kill && !event.is_tk) {
        //console.log('...you got a kill... checking multikills count==2....');
        if (multikills==1) {
            return (true);
        }
    }
    return false;
},['two.mp3'],3);  
var triplekill = new Achievement('triplekill','Triple Kill!','3 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==2) {
            return (true);
        }
    }
    return false;
},['three.mp3'],3);
var multikill = new Achievement('multikill','Multi Kill!','4 kills in quick succession!', function (event) {
    if (event.is_kill && !event.is_tk) {
        if (multikills==3) {
            return (true);
        }
    }
    return false;
},['four.mp3'],3);
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
},['count_laughing.mp3'],3);
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
},['Low Profile.ogg'],20);

var sneaker_death = new Achievement('sneakerdeath','Long Range Wanker!','You were killed by an invisible bastard!', function (event) {
    if (event.is_death && !event.is_tk) {
        if (event.payload.attacker_loadout_id=='1' || event.payload.attacker_loadout_id=='8' || event.payload.attacker_loadout_id=='15'|| event.payload.attacker_loadout_id=='27') {
            // 1,8.15,190 = infil loadouts - 190 = ns - could be 15+7
            // see http://www.planetside-universe.com/api/census.php?q=json%2Fget%2Fps2%2Floadout%3Fc%3Alimit%3D20&decode=true
            return true;
        }
    }
    return false;
},['invisibleman.mp3'],4);


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
},['pew.mp3'],6);

var nocar = new Achievement('nocar',"Dude, where's my car?",'You killed a harasser!', function (event) {
    if (event.payload.event_name=='VehicleDestroy') {
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
},['wallescream.mp3','antispitty1.mp3']);

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
},['rudeness.mp3','bus-driver-crap.mp3']);

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
},['rocket-man.mp3']);


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
},['cutcutcut.mp3','stabbing_motion.mp3','do-knife-thing.mp3']);


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

var reviver = new Achievement('revive','Revive!','You revived someone!', function (event) {
    if (event.payload.event_name=="GainExperience" && is_player(event.payload.character_id)) {
        // 7 = revive, 57 = squad revive
        if (event.payload.experience_id=='7' || event.payload.experience_id=='53' ) {
            window.revive_count_streak++;
            return true;
        }
    }
    return false;
},['xp.mp3','Bwup!.ogg'],['To a Zone... one of Danger.ogg'],20);

var repeat = new Achievement('repeatcustomer','Repeat Customer!','You killed the same person 2 times in a row!', function (event) {
    if (event.is_kill && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.killstreak==2) {
           return true;
       }
    }
    return false;
},['Whats Up_ Whattya been doin_.ogg'],9);

var nemesis = new Achievement('nemesis','Nemesis!','You were killed by the same person more than 3 times!', function (event) {
    if (event.is_death && !event.is_tk) {
       char = get_local_character(event.payload.character_id);
       if (char.deathstreak>2) {
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
},["that's-not-entirely-accurate.mp3"],5);

var assister = new Achievement('helper','Santas Little Helper!','You assisted killing someone 5 times in a row without killing anybody yourself!', function (event) {
    if (event.payload.event_name=="GainExperience") {
        // 2 assist, 371 priority assist
        if (event.payload.experience_id=='2' || event.payload.experience_id=='371') {
            assist_streak++;
            if (assist_streak%5==0 && assist_streak>0) {
                var msg = "You are Santa's Little Helper! 5 assists in a row without any kills yourself!";
                //msg += print_character(event.character_id);
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

var tk_sound = new Achievement('teamkill','Teamkill!','You killed a friendly!', function (event) {
    if (event.payload.event_name=="Death") {
        if (event.is_kill && event.is_tk) {
            return true;
        }
    }
    return false;
},['My Bad! Thats on me.ogg','count_sorry.mp3','no_friends_count.mp3']);

var tk_sound = new Achievement('badteamkill','Blue on blue!','You were killed by a friendly!', function (event) {
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
},['Just Pout.ogg','PAM - yeehhh, sploosh.ogg'],5);

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
},['aallrighty.mp3'],10);

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