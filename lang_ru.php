<?php

function lang($phrase){
    static $lang_arr = array(
        'START_BUTTON' => 'Включить звук / Пуск',
        'MANAGE_PLAYERS' => 'Управляйте игроками',
        'GLOBAL_SETTINGS' => 'Глобальные настройки',
        'EDIT_VOICEPACK' => 'редактировать голоса'
    );
    if (array_key_exists($phrase, $lang_arr)) {
        return $lang_arr[$phrase];    
    }
    else {
        return "[UNKNOWN TRANSLATION]";
    }
}