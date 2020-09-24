var loadouts_raw = {"loadout_list":[{"loadout_id":"1","profile_id":"2","faction_id":"2","code_name":"NC Infiltrator"},{"loadout_id":"3","profile_id":"4","faction_id":"2","code_name":"NC Light Assault"},{"loadout_id":"4","profile_id":"5","faction_id":"2","code_name":"NC Medic"},{"loadout_id":"5","profile_id":"6","faction_id":"2","code_name":"NC Engineer"},{"loadout_id":"6","profile_id":"7","faction_id":"2","code_name":"NC Heavy Assault"},{"loadout_id":"7","profile_id":"8","faction_id":"2","code_name":"NC MAX"},{"loadout_id":"8","profile_id":"10","faction_id":"3","code_name":"TR Infiltrator"},{"loadout_id":"10","profile_id":"12","faction_id":"3","code_name":"TR Light Assault"},{"loadout_id":"11","profile_id":"13","faction_id":"3","code_name":"TR Medic"},{"loadout_id":"12","profile_id":"14","faction_id":"3","code_name":"TR Engineer"},{"loadout_id":"13","profile_id":"15","faction_id":"3","code_name":"TR Heavy Assault"},{"loadout_id":"14","profile_id":"16","faction_id":"3","code_name":"TR MAX"},{"loadout_id":"15","profile_id":"17","faction_id":"1","code_name":"VS Infiltrator"},{"loadout_id":"17","profile_id":"19","faction_id":"1","code_name":"VS Light Assault"},{"loadout_id":"18","profile_id":"20","faction_id":"1","code_name":"VS Medic"},{"loadout_id":"19","profile_id":"21","faction_id":"1","code_name":"VS Engineer"},{"loadout_id":"20","profile_id":"22","faction_id":"1","code_name":"VS Heavy Assault"},{"loadout_id":"21","profile_id":"23","faction_id":"1","code_name":"VS MAX"}],"returned":18};

var loadouts = {};
loadouts_raw.loadout_list.forEach(loadout => {
    loadouts[loadout.loadout_id] = loadout;
});
// add missing loadouts - may not be correct!
loadouts['28'] = {'faction_id':'4','loadout_id':'28','profile_id':'190'};
loadouts['29'] = {'faction_id':'4','loadout_id':'29','profile_id':'191'};
loadouts['30'] = {'faction_id':'4','loadout_id':'30','profile_id':'192'};
loadouts['31'] = {'faction_id':'4','loadout_id':'31','profile_id':'193'}; // engie
loadouts['32'] = {'faction_id':'4','loadout_id':'32','profile_id':'194'};
loadouts['33'] = {'faction_id':'4','loadout_id':'33','profile_id':'195'};

