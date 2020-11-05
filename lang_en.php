<?php

function lang($phrase){
    static $lang_arr = array(
        'START_BUTTON' => 'Enable Audio / Start',
        'MANAGE_PLAYERS' => 'Manage Players',
        'GLOBAL_SETTINGS' => 'Global Settings',
        'EDIT_VOICEPACK' => 'Edit Voicepack'
    );
    if (array_key_exists($phrase, $lang_arr)) {
        return $lang_arr[$phrase];    
    }
    else {
        return "[UNKNOWN TRANSLATION]";
    }
}