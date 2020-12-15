<?php 
/* ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL); */

$root = "/ps2/"; // change to appropriate sub-folder - eg. ps2 when live

function pprint_r ($thing) {
	echo "<pre>"; print_r ($thing); echo "</pre>";
}

function get_post ($var) {
	if (isset($_POST[$var])) {
		return $_POST[$var];
	}
	else {
		return false;
	}
}

$request = $_SERVER['REQUEST_URI'];
$to_remove = $root;
$request = str_ireplace($to_remove, "", $request);
$segments = preg_split('@/@', parse_url($request, PHP_URL_PATH), NULL, PREG_SPLIT_NO_EMPTY);

// multilanguage

$lang="en";
if (isset($_GET['lang'])) {
	$lang = $_GET['lang'];
}
if (in_array($lang,['en','ru'])) {
	include_once('lang_' . $lang . ".php");
}
else {
	include_once('lang_en.php');
}

// get user
$user = false;
$passed_player_id = false;
$passed_player_name = false;

function filter_filename($filename, $beautify=true) {
    // sanitize filename
    $filename = preg_replace(
        '~
        [<>:"/\\|?*]|            # file system reserved https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
        [\x00-\x1F]|             # control characters http://msdn.microsoft.com/en-us/library/windows/desktop/aa365247%28v=vs.85%29.aspx
        [\x7F\xA0\xAD]|          # non-printing characters DEL, NO-BREAK SPACE, SOFT HYPHEN
        [#\[\]@!$&\'()+,;=]|     # URI reserved https://tools.ietf.org/html/rfc3986#section-2.2
        [{}^\~`]                 # URL unsafe characters https://www.ietf.org/rfc/rfc1738.txt
        ~x',
        '-', $filename);
    // avoids ".", ".." or ".hiddenFiles"
    $filename = ltrim($filename, '.-');
    // optional beautification
    if ($beautify) $filename = beautify_filename($filename);
    // maximize filename length to 255 bytes http://serverfault.com/a/9548/44086
    $ext = pathinfo($filename, PATHINFO_EXTENSION);
    $filename = mb_strcut(pathinfo($filename, PATHINFO_FILENAME), 0, 255 - ($ext ? strlen($ext) + 1 : 0), mb_detect_encoding($filename)) . ($ext ? '.' . $ext : '');
    return $filename;
}

if (sizeof($segments)>0) {
	// user = audio pack user
	$user = filter_filename (urldecode($segments[0]),false);
	/* pprint_r ($user);
	pprint_r (urldecode($segments[0])); */
	if ($user != urldecode($segments[0])) {
		// filtered user != raw passed user, filename is unsafe
		$user=false;
		echo "<style>body{font-family:sans-serif;display:flex; height:100vh; justify-content:center; align-items:center;}</style><h1>Unsafe name - please use characters which are safe for filenames only!</h1>";
		exit(0);
	}
	/* if (ctype_alnum ($segments[0])) {
		if (strlen($segments[0]<16)) {
			$user = $segments[0];
		}
	} */
	if (sizeof($segments)>1) {
		// got player id too
		if (ctype_digit($segments[1])) {
			$passed_player_id = $segments[1];
		}
	}
	if (sizeof($segments)>2) {
		// got player name too
		if (ctype_alnum($segments[2])) {
			$passed_player_name = $segments[2];
		}
	}
}

$config_json_path = false;
if (file_exists('userconfigs/' . $user . '_config.json')) {
	$config_json_path = $root . 'userconfigs/' . $user . '_config.json';
}
else {
	// user has no config yet, make one based on bobmitch default
	copy('userconfigs/bobmitch_config.json', 'userconfigs/' . $user . '_config.json' );
	$config_json_path = $root . 'userconfigs/' . $user . '_config.json';
}
$server_claim_code = false;
if (file_exists('userconfigs/' . $user . '_claim.txt')) {
	$server_claim_code = file_get_contents('userconfigs/' . $user . '_claim.txt');
}

?>
<?php if (isset($_POST['action'])):?>
	<?php 
	header('Content-Type: application/json');
	// first check submitted claim code matches stored claim code
	$submitted_claim_code = get_post('claim_code');
	$action = get_post('action');
	
	if ($action=='save') {
		if (!$submitted_claim_code) {
			echo '{"success":0,"msg":"Changes not saved - enter your password if you think this is your URL!"}';
			exit(0);
		}
		if (password_verify($submitted_claim_code, $server_claim_code) || $submitted_claim_code==$server_claim_code) {
			$config = get_post('config');
			$valid_json = json_decode($config);
			// copy files from source folder to destination if necessary
			if (!is_dir('./useraudio/' . $user)) {
				mkdir('./useraudio/' . $user);
			}
			foreach($valid_json as $trigger) {
				foreach ($trigger->soundfiles as &$url) {
					if (strpos($url,"bobmitch.com")) {
						// uploaded 
						if (strpos($url,"useraudio")) {
							// really not a default
							$parts1 = explode("useraudio",$url); 
							$parts2 = explode('/',$parts1[1]);
							$source_user = $parts2[1];
							$filename = $parts2[2];
							$src = __DIR__ . "/useraudio/" . $source_user . "/" . $filename;
							$dest = __DIR__ . "/useraudio/" . $user . "/" . $filename;
							if ($user!==$source_user) {
								// copy file from original user audio folder to your audio folder and change config
								copy($src, $dest);
								$new_url = "https://bobmitch.com/ps2/useraudio/" . $user . "/" . $filename;
								$url = $new_url;
							}
						}
					}
				}
			}
			$converted_json = json_encode($valid_json, JSON_UNESCAPED_SLASHES );
			if ($converted_json) {
				file_put_contents('userconfigs/' . $user . '_config.json',$converted_json);
				echo '{"success":1,"msg":"saved"}';
			}
			else {
				echo '{"success":0,"msg":"invalid config"}';
			}
		}
		else {
			echo '{"success":0,"msg":"Incorrect password/passphrase!"}';
			exit(0);
		}
	}
	elseif ($action=="copy_and_create") {
		$pack_name = get_post('new_packname');
		$new_password = get_post('newpack_password');
		$new_config = get_post('new_config');
		if ($pack_name) {
			$clean_packname = filter_filename (urldecode($pack_name),false);
			if ($pack_name==$clean_packname) {
				// ok packname
				if (file_exists('userconfigs/' . $pack_name . '_claim.txt')) {
					echo '{"success":0,"msg":"Soundpack already exists!"}';
					exit(0);
				}
				if (!$new_password) {
					echo '{"success":0,"msg":"You must provide a password!"}';
					exit(0);
				}
				$valid_json = json_decode($new_config);
				if (!$valid_json) {
					echo '{"success":0,"msg":"Invalid config"}';
					exit(0);
				}
				// got here, have password and user is good to create
				$hash = password_hash ($new_password, PASSWORD_DEFAULT);
				file_put_contents ('userconfigs/' . $pack_name . '_claim.txt', $hash);
				// copy files from source folder to destination 
				if (!is_dir('./useraudio/' . $pack_name)) {
					mkdir('./useraudio/' . $pack_name);
				}
				foreach($valid_json as $trigger) {
					foreach ($trigger->soundfiles as &$url) {
						if (strpos($url,"bobmitch.com")) {
							// uploaded 
							if (strpos($url,"useraudio")) {
								// really not a default
								$parts1 = explode("useraudio",$url); 
								$parts2 = explode('/',$parts1[1]);
								$source_user = $parts2[1];
								$filename = $parts2[2];
								$src = __DIR__ . "/useraudio/" . $source_user . "/" . $filename;
								$dest = __DIR__ . "/useraudio/" . $pack_name . "/" . $filename;
								if ($user!==$source_user) {
									// copy file from original user audio folder to your audio folder and change config
									copy($src, $dest);
									$new_url = "https://bobmitch.com/ps2/useraudio/" . $pack_name . "/" . $filename;
									$url = $new_url;
								}
							}
						}
					}
				}
				$converted_json = json_encode($valid_json, JSON_UNESCAPED_SLASHES );
				if ($converted_json) {
					file_put_contents('userconfigs/' . $pack_name . '_config.json',$converted_json);
					echo '{"success":1,"msg":"New pack created"}';
					exit(0);
				}
				else {
					echo '{"success":0,"msg":"Invalid config"}';
					exit(0);
				}
			}
			else {
				echo '{"success":0,"msg":"Bad soundpack name"}';
				exit(0);
			}
		}
		else {
			echo '{"success":0,"msg":"No soundpack name"}';
			exit(0);
		}
	}
	elseif ($action=='upload_audio') {
		if (!$submitted_claim_code) {
			echo '{"success":0,"msg":"Invalid request"}';
			exit(0);
		}
		if (password_verify($submitted_claim_code, $server_claim_code) || $submitted_claim_code==$server_claim_code) {
			if (!is_dir('./useraudio/' . $user)) {
				mkdir('./useraudio/' . $user);
			}
			if (isset($_FILES['audiofile'])) {
				$audio_file = $_FILES['audiofile'];
				if ($audio_file['size']>400000) {
					echo '{"success":0,"msg":"File too large - must be 400kb or smaller"}';
					exit(0);
				}
				if (explode('/',$audio_file['type'])[0]!=='audio') {
					if ($audio_file['type']==="video/ogg") {
						// we good
					}
					else {
						echo '{"success":0,"msg":"File must be mp3 or ogg file - not '.$audio_file['type'].'"}';
						exit(0);
					}
				}
				// got here, file is good
				$url = "https://bobmitch.com/ps2/useraudio/" . $user . "/" . $audio_file['name'];
				$dest = __DIR__ . "/useraudio/" . $user . "/" . $audio_file['name'];
				if (file_exists($dest)) {
					echo '{"success":0,"msg":"File already exists."}';
				}
				else {
					move_uploaded_file($audio_file['tmp_name'], $dest);
					echo '{"success":1,"msg":"Audio uploaded!","url":"'.$url.'"}';
				}
			}
			else {
				echo '{"success":0,"msg":"No file uploaded"}';
			}
		}
		else {
			echo '{"success":0,"msg":"You are not authorized to make this change"}';
		}
		exit(0);
	}
	elseif ($action=="delete_file") {
		$sound_url = urldecode(get_post('sound_url'));
		if (password_verify($submitted_claim_code, $server_claim_code) || $submitted_claim_code==$server_claim_code) {
			if (strpos($sound_url, 'https://bobmitch.com/') !== false) {
				$filename = basename($sound_url);
				$dest = __DIR__ . "/useraudio/" . $user . "/" . $filename; 
				if ($user!==explode('/',urldecode($sound_url))[5]) {
					echo '{"success":0,"msg":"Audio trigger removed, file not deleted - it is from another soundpack."}';
					exit(0);
				}
				if (file_exists($dest)) {
					if (unlink($dest)) {
						echo '{"success":1,"msg":"File deleted!"}';
					}
					else {
						echo '{"success":0,"msg":"Unknown error deleting file"}';
					}
				}
				else {
					echo '{"success":0,"msg":"Error deleting file - not found"}';
				}
			}
			else {
				echo '{"success":0,"msg":"Custom audio not hosted here - file not deleted"}';
			}
		}
		else {
			echo '{"success":0,"msg":"You are not authorized to make this change"}';
			exit(0);
		}
	}
	elseif ($action=='test_claim') {
		if (password_verify($submitted_claim_code, $server_claim_code) || $submitted_claim_code==$server_claim_code) {
			echo '{"success":1,"msg":"Correct password/passphrase!"}';
			exit(0);
		}
		else {
			echo '{"success":0,"msg":"Incorrect password/passphrase!"}';
			exit(0);
		}
	}
	elseif ($action=='claim') {
		if ($submitted_claim_code && $user) {
			$hash = password_hash ($submitted_claim_code, PASSWORD_DEFAULT);
			file_put_contents ('userconfigs/' . $user . '_claim.txt', $hash);
			echo '{"success":1,"msg":"claimed"}';
		}
		else {
			echo '{"success":0,"msg":"not claimed"}';
		}
	}
	// postAjax('', {"action":"change_password","claim_code":window.claim_code,"new_claim_code":new_claim_code}, function(data) { 
	elseif ($action=='change_password') {
		if (!$user) {
			echo '{"success":0,"msg":"You are in the default URL - go to your own soundpack URL!"}';
			exit(0);
		}
		$new_claim_code = get_post('new_claim_code');
		if (password_verify($submitted_claim_code, $server_claim_code) || $submitted_claim_code==$server_claim_code) {
			$hash = password_hash ($new_claim_code, PASSWORD_DEFAULT);
			file_put_contents ('userconfigs/' . $user . '_claim.txt', $hash);
			echo '{"success":1,"msg":"Changed password/passphrase!"}';
			exit(0);
		}
		else {
			echo '{"success":0,"msg":"Incorrect password/passphrase!"}';
			exit(0);
		}
	}
		
	exit(0); // don't progress beyond this point if API call :)
	?>
<?php endif; ?>

<?php // END OF API ?>

<html>
	<head>
		<title>Planetside Announcer</title>
		<meta charset="UTF-8">
		<meta name="description" content="Planetside 2 Announcer">
		<meta name="keywords" content="planetside, announcer, funny">
		<meta name="author" content="Bob Mitchell">
		<link rel="stylesheet" href="<?php echo $root;?>style.css">
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.0/css/bulma.css" integrity="sha256-oSsWW/ca1ll8OVu2t4EKkyb9lmH0Pkd8CXKXnYP4QvA=" crossorigin="anonymous">
		<link rel="icon" type="image/png" href="https://bobmitch.com/ps2/favicon.ico">
		<script>var lang="<?php echo $lang; ?>";</script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/slim-select/1.26.0/slimselect.min.js"></script>
		<link href="https://cdnjs.cloudflare.com/ajax/libs/slim-select/1.26.0/slimselect.min.css" rel="stylesheet"></link>
		<!-- <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@creativebulma/bulma-tooltip@1.2.0/dist/bulma-tooltip.min.css" integrity="sha256-OdzWB7wl1AMkFaqhYBnoQJGUJMDAexXa44rXs/d2n4A=" crossorigin="anonymous"> -->
		<!-- <link rel="stylesheet" href="https://unpkg.com/bulmaswatch/darkly/bulmaswatch.min.css"> -->
		<!-- Global site tag (gtag.js) - Google Analytics -->
		<script async src="https://www.googletagmanager.com/gtag/js?id=UA-10321584-7"></script>
		<script src="https://kit.fontawesome.com/e73dd5d55b.js" crossorigin="anonymous"></script>
		<script>
			window.dataLayer = window.dataLayer || [];
			function gtag(){dataLayer.push(arguments);}
			gtag('js', new Date());
			gtag('config', 'UA-10321584-7');

			function postAjax(url, data, success) {
				var params = typeof data == 'string' ? data : Object.keys(data).map(
						function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
					).join('&');

				var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
				xhr.open('POST', url);
				xhr.onreadystatechange = function() {
					if (xhr.readyState>3 && xhr.status==200) { success(xhr.responseText); }
				};
				xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
				xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
				xhr.send(params);
				return xhr;
			}

			
		</script>

	</head>

	<body class='loading <?php if ($server_claim_code) {echo " claimed ";}?> <?php if (!$server_claim_code) {echo " unclaimed ";}?> <?php if (!$user) {echo " vanilla ";} else { echo " " . $user . " ";}?>'>
		<div id='ajax' class=''>
			<div id='ajax_spinner' class='spinner'></div>
		</div>
	
		<div id='splash' class=' loading'>
			<div class='contain'>
				<h1 class='splashtitle'>Planetside 2 Announcer</h1>
				<div id='spinner' class='loadingonly spinner'></div>
				<button id='start_button' onclick='document.querySelector("#splash").classList.add("hide");allow_voicepack();' class='loaded button btn is-warning is-large'><?php echo lang('START_BUTTON');?></button>
				<p class='splashabout'>By [BAX] BobMitch</p>
			</div>
		</div>
		
		<div class='container' id="page-wrapper">
			<nav id='nav' class="navbar" role="navigation" aria-label="main navigation">
				<div class="navbar-brand">
				  <a class="navbar-item" href="https://bobmitch.com/ps2">
					<h3 class='title is-3'>Planetside Announcer</h3>
				  </a>

				  <div class='navbar-item' id="playerstatus">
				  		<i class="fas fa-user"></i>&nbsp;
					  	<span title='Tracked Player' data-char_id="0" id='playername' class='tag offline'>Player Offline</span>
				  </div>

				  <div class="navbar-item has-dropdown is-hoverable">
						<a class="navbar-link">
							Voicepack: <?php if ($user) {echo $user;} else {echo 'BobMitch';}?>
						  </a>
				  
						  <div class="navbar-dropdown">
						  	<a  href="/ps2/bobmitch" class="navbar-item">BobMitch <span class='info'>(default)</span></a>
							  <a  href="/ps2/Imperium" class="navbar-item">ClutchTastic <span class='info'>[CdrClutch]</span></a>
							  <a  href="/ps2/gordonramsey" class="navbar-item">Gordon Ramsey <span class='info'>[BobMitch]</span></a>
							  <a  href="/ps2/Imperium" class="navbar-item">Imperium <span class='info'>[CdrClutch]</span></a>
							  <a  href="/ps2/kaamelott" class="navbar-item">Kaamelott <span class='info'>(FR)</span></a>
							<a  href="/ps2/mm" class="navbar-item">Cyka Blyat <span class='info'>[MM](RUS)</span></a>
							<a  href="/ps2/myian" class="navbar-item">Myian</a>
							<a  href="/ps2/rus" class="navbar-item">Russian <span class='info'>(RUS)</span></a>
							<a  href="/ps2/wh40k" class="navbar-item">WH40K <span class='info'>[Lollka]</span></a>		
							<a  href="/ps2/bloodforthebloodgod" class="navbar-item">Blood For The Blood God<span class='info'>[Lollka]</span></a>	
						</div>
					</div>
				  
				  
			  
				  <a role="button" class="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
				  </a>
				</div>
			  
				<div id="navbarBasicExample" class="navbar-menu">
				  
			  
				  <div class="navbar-end">
					<div class="navbar-item has-dropdown is-hoverable">
						<a class="navbar-link">
							More
						  </a>
				  
						  <div class="navbar-dropdown">
							<a id='show_help_modal' class="navbar-item">
								Help
							  </a>
							<a id='show_about_modal' class="navbar-item">
							  About
							</a>
							<!-- <a id='show_export_modal' class="navbar-item">
								Export/Import Soundpack
							  </a> -->
							  <a id='toggle_view' class="navbar-item">
								OBS View
							  </a>
							<a id='show_debug_modal' class="navbar-item">
							  Debug
							</a>
						</div>
					</div>
					<div class="navbar-item">
					  <div class="buttons">

						
					  <a id='show_player_modal' class="button is-primary">
							<strong><i class="fas fa-users"></i> <?php echo lang('MANAGE_PLAYERS');?></strong>
						  </a>
						  <a id='show_settings_modal' class="button is-primary">
							<strong><i class="fas fa-cog"></i> <?php echo lang('GLOBAL_SETTINGS');?></strong>
						  </a>
						  <a id='show_achievements_modal' class="button is-primary">
							<strong><i class="fas fa-file-audio"></i> <?php echo lang('EDIT_VOICEPACK');?></strong>
						  </a>
						  
						  
					  </div>
					</div>
				  </div>
				</div>
			  </nav>

			
			

			<div id='stats' class="field is-grouped is-grouped-multiline moveable">
				<h5 class='label'>STATS</h5>
				<div id='bs_stat' class="control ">
					<div class="tags has-addons">
						<span class="tag is-dark">Bodyshot Streak</span>
						<span data-variable='bodyshotkillstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div id='hs_stat' class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">HS Streak</span>
						<span data-variable='headshotstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div id='killstreak_wrap' data-value='0' class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">Killstreak</span>
						<span data-variable='killstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div id='ass_stat' class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">Assist-streak</span>
						<span data-variable='assist_streak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<!-- <div class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">Multi Kill Streak</span>
						<span data-variable='multikills' class="autoupdate tag is-info">0</span>
					</div>
				</div> -->
				<div id='kd_stat' class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">K/D</span>
						<span data-variable='kd' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div id='kpm_stat' class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">KPM</span>
						<span data-variable='kpm' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				
			</div>
			
			<ul id="messages"></ul>

			<table class='table is-fullwidth moveable' id='events'>
			
				<thead>
					<tr>
						<th>Time</th>
						<th>Event</th>
						<th>Special</th>
					</tr>
				</thead>
				<tbody id='events_body'>
					<tr class="obs_example kill"><td class="timestamp"><span class="nice_timestamp">8:44:28</span></td><td class="event_info"><span class="event_type you_killed">You killed </span><span class="profile_name Combat Medic">Combat Medic</span><span class="char faction faction2"> <span class="charname"><span class="outfit">SF8</span>&nbsp;MrExampleLongName</span> <span class="br">BR:13</span> <span class="br kdr">KD: 0.53</span></span><span class="weapon_name">Some Cheesy Weapon Probably</span> <span class="weapon_type"> (Grenade)</span> </td><td class="pills"></td></tr>
				</tbody>
				
			</table>

			

			<div id='pop' class="moveable">
				<h5 class='label'>POPULATION</h5>
				<!-- <select id='world' name='world'>
					<option value=''>Please Select</option>
					<option value='1'>Connery</option>
					<option value='17'>Emerald</option>
					<option value='13'>Cobalt</option>
					<option value='10'>Miller</option>
					<option value='40'>SolTech</option>
				</select> -->
				
				<div class='pop_info_wrap'>
					<h1 class='pop_server'>Connery</h1>
					<h2 class='pop_total'>1</h2>
				</div>
				<div class='pop_per_faction'>
					<div class='pop_faction nc'>
						<span id='nc_pop'>1</span>
					</div>
					<div class='pop_faction tr'>
						<span id='tr_pop'>1</span>
					</div>
					<div class='pop_faction vs'>
						<span id='vs_pop'>1</span>
					</div>
				</div>

				
			</div>

			
		</div>

		<div id='playermodal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title"><?php echo lang('MANAGE_PLAYERS');?></p>
				<button class="delete" aria-label="close"></button>
			  </header>
			  <section class="modal-card-body">
				<div class="field has-addons">
					<div class="control">
					  <input id='playersearch' class="input" type="text" placeholder="Find player">
					</div>
					<div class="control">
					  <a id='playersearch_btn' class="button is-info">
						Search
					  </a>
					</div>
				  </div>
				<div id='playersearchresults'></div>
				<hr>
				<div id='player_list_wrap' class="field is-grouped is-grouped-multiline">
					
				</div>
			  </section>
			  <footer class="modal-card-foot">
				
			  </footer>
			</div>
		  </div>

		  <div id='achievement_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">
				<?php echo lang('EDIT_VOICEPACK');?> <i id='unlock' title='URL already claimed' class="claimedonly fas fa-lock"></i> <span class='claimedonly info'>(click to unlock)</span>&nbsp;&nbsp;&nbsp;&nbsp;
				<button id='copy_config' class='button claimed_only btn is-small is-primary'>Copy Soundpack</button>
				<button id='copy_and_create_config' class='button claimed_only btn is-small is-warning'>Copy And Create New</button>
				<button id='paste_config' class='button authorized_only btn is-small is-warning'>Paste Soundpack</button>
				<button id='add_custom_trigger' class='button authorized_only btn is-small is-primary'>Add Custom Weapon Trigger</button>
				<button id='change_password' class='pull-right is-pulled-right button authorized_only btn is-small is-danger'>Change Password</button></p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
				
				<div class='flex'>
					<div>
						<label class="label">Search Triggers</label>
					
						<div class="field has-addons">
							<div class="control">
								<input class="input" id="triggersearch" type="text" placeholder="Search">
							</div>
							<div class="control">
								<a id="triggersearchclear" class="button is-info">
									Clear
								</a>
							</div>
						</div>
					</div>

					<div id='filter_wrap' class="control authorized_only">
						<label class="label">Filter</label>
						<label class="radio">
						<input value='all' checked type="radio" name="showtriggers">
						All
						</label>
						<label class="radio">
						<input value='enabled' type="radio" name="showtriggers">
						Enabled
						</label>
						<label class="radio" >
						<input value='disabled' type="radio" name="showtriggers" >
						Disabled
						</label>
					</div>
				</div>
				
				<div id='achievments_list'></div>
				<p class='vanillaonly'>
				If you want to create your own custom soundpack, simply add a catchy name to the URL with a slash at the beginning. 
				Click <a href='#' onclick='var newname=prompt("Enter a soundpack name with no spaces:"); window.location="https://bobmitch.com<?php echo $root;?>" + newname;'>here</a> to choose a name - if the name isn't taken, you can claim it with a secret passphrase/password when you start making changes - and start to create your own soundpack thet you can share with the URL itself.
				</p>
				<p class='vanillaonly'>
				If you don't own the URL, you can still make changes to the soundpack, they just won't be saved permanently. You can hit the 'copy config' button, go to your own owned URL, then hit 'paste config' to start using someone elses creation as a starting point. :)
				</p>
			  </section>
			  <footer class="modal-card-foot">
				
			  </footer>
			</div>
		  </div>

		  <div id='help_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Help</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
			  	<p>For all help/discussion/support for this tool, go to <a href="https://discord.gg/JMEnq4a">BobMitch's discord</a>.</p>
				<hr>
				<p>General <a href="https://docs.google.com/document/d/1kgE2FWnYD6nthUEiKCSS2XfFfhOKezTZkYhS9L2Oj7g">Quick Guide</a></p>
			  	<p>OBS - <a href="https://docs.google.com/document/d/1x0GS700wFmZqSRidfKzLpTQ5AhIdwTP2_XxK_7ozA5U/edit?usp=sharing">Quick guide</a></p>
				<hr>
				<p><strong>Any custom sounds added to built-in triggers will prevent default sounds from playing!</strong></p>
			  </section>
			  
			</div>
		  </div>

		  <div id='copy_and_create_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Copy and Create New Soundpack</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
			  	<form method="POST" id='copy_and_create_form' onsubmit="return  copy_and_create();">
				 		 <div class="field">
							<label class="label">Soundpack Name</label>
							<div class="control">
							  <input required id='copy_and_create_name' name='description' class="input" type="text" placeholder="Soundpack Name/URL">
							</div>
						  </div>
						  <p class='help'>This is the text added to the end of the URL - eg. https://bobmitch.com/ps2/soundpackname</p>
						  <div class="field">
							<label class="label">Password/Passphrase</label>
							<div class="control">
							  <input required id='copy_and_create_password' name='description' class="input" type="password" placeholder="Password">
							</div>
						  </div>
						  <p class='help'>The password you will use to unlock your soundpack to make changes. Keep this safe!</p>
						  <div class="field is-grouped">
							<div class="control">
							  <button type='submit' id='submit_copy_and_create' class="button is-link is-success">Create New</button>
							</div>
						  </div>
				</form>
			  </section>
			  
			</div>
		  </div>

		  

		  <div id='custom_trigger_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Custom Weapon Trigger</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
					<form id='custom_trigger_form'>


						<div class="field">
							<label class="label">Weapon</label>
							<div class="control">
							  <div class="slimselect notjustselectanymore-bulmalookedbad">
								<select required id="custom_trigger_weapon_id" name='custom_trigger_weapon_id' >
									<option value="" >Please Select</option>
								</select>
							  </div>
							</div>
						  </div>

						<div class="field">
							<label class="label">Label</label>
							<div class="control">
							  <input id='custom_trigger_name' name='name' required class="input" type="text" placeholder="Name">
							</div>
							<p class="help">Shown in killboard in special column</p>
						  </div>

						  <div class="field">
							<label class="label">Brief Description</label>
							<div class="control">
							  <input id='custom_trigger_description' name='description' class="input" type="text" placeholder="Description">
							</div>
						  </div>

						  
						  
						  <div class="field">
							<div class="control">
							  <label class="radio">
								<input checked value="1" id='onkill' type="radio" name="onkill">
								Trigger on Kill
							  </label>
							  <label class="radio">
								<input value="0" type="radio" id='ondeath' name="onkill">
								Trigger on Death
							  </label>
							</div>
						  </div>

						  <div class='field'>
						  	<div class='control'>
							  <label class="label">Group Kill Trigger Value</label>
							  <input id='group_kill_trigger_value' name='description' class="input" value="1" type="number" min="1" max="999" placeholder="1">
							  <p class="help">Number of simultaneous kills required to trigger (if trigger on kill selected).</p>
							</div>
						  </div>
						  
						  <div class="field is-grouped">
							<div class="control">
							  <button type='submit' id='submit_custom_trigger' class="button is-link">Save</button>
							</div>
						  </div>
					</form>
			  </section>
			  
			</div>
		  </div>

		  <div id='edit_image_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Edit Image</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
					<form id='custom_image_form'>
						<input hidden name='edit_image_achievement_id' id='edit_image_achievement_id' value=''/>
						<div class="field">
							<label class="label">Image/MP4 URL</label>
							<div class="control">
							  <input id='custom_image_url' name='custom_image_url' class="input" type="text" placeholder="Image URL">
							</div>
							<p class="help">Image/MP4 video Must be hosted on HTTPS site, and have CORS enabled (such as <a href='https://imgur.com' target='_blank'>imgur.com</a>)</p>
						  </div>
						  
						  <div class="field is-grouped">
							<div class="control">
							  <button type='submit' id='submit_custom_image' class="button is-link">Save</button>
							</div>
						  </div>
					</form>
			  </section>
			  
			</div>
		  </div>

		 

		  <div id='about_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">About</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
					<p>First of all, this is <em>not</em> a replacement for Recursion's stat tracker application - there is no  crosshair overlay, in-game overlayed stats/popups, permanent stat tracking, achievement logging, or any of the myriad cool things that software offers - 
					this is simply just fun little web project to make funny noises when funny things happen in Planetside 2 without having to install any applications or 
					register with any third-party sites.</p>
					
					<p>For help or to discuss this tool, <a href="https://discord.gg/JMEnq4a">come to my discord server</a>.</p>
					<p>Note - this project is updated frequently and bugs are common. :) Don't get mad, just report any issues you find - I'm generally pretty responsive.</p>
					<hr>
					<h4 class='is-4 title'>Thank You!</h4>
					<p>Special thanks to <a href="https://twitch.tv/myian" target="_blank">Myian</a> for help with testing, coding, debugging and suggestions.</p>
					<p>Cheers to <a href="https://www.twitch.tv/n7jpicard" target="_blank">N7jpicard</a> for help with overlay testing and end-user feedback.</p>
					<p>Many thanks to Charoplet over at <a href="https://ps2-news.com/">PS2 News</a> for giving great advice, testing, and pushing for improvements.</p>
					<p>Thanks to <a href="https://www.twitch.tv/aeflic" target="_blank">Aeflic</a> for occasionally remembering to use this announcer and having the best beard in the game.</p>
					<hr>
					<h5>Donations</h5>
					<p>I really don't need the money, but if you want to say <a target='_blank' href='https://paypal.me/rddm1976?locale.x=en_US'>thanks</a>, that's cool!</p>
					<p>Even better, go buy some of my wife's <a target='_blank' href='https://marcymitchellart.com'>awesome art</a>!</p>
					<p>[BAX] BobMitch</p>
					<br>
			  </section>
			  
			</div>
		  </div>

		  <div id='noplayers_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Welcome!</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
					<p>This thing does nothing if you're not tracking at least one player - so don't forget to click 'manage players', find your player(s), and add them to the list!</p>
			  </section>
			  
			</div>
		  </div>

		  <div id='debug_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Debug</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
					<pre id='debug_content'>
					</pre>
			  </section>
			  
			</div>
		  </div>

		  <div id='settings_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title"><?php echo lang('GLOBAL_SETTINGS');?></p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
				<div class='control flex'>
						<label  for='volume'>Global Volume: </label>
						<div>
							<input type="range" id="volume" name="volume" value="100" min="0" max="100"/> 
						</div>
					</div>  
					<div class='control flex'>
						<label  for='volume'>OBS Image Display Time (seconds): </label>
						<div>
							<input type="number" id="image_display_time" name="image_display_time" value="5" min="1" max="10"/> 
						</div>
					</div>
					<div class='control flex'>
						<label class='checkbox' for='countkills'>Say Killcount
							<input type='checkbox' id='countkills'/>
						</label>
					</div>
					<p class='info'>TTS says killcount in absence of any other audio triggers. <em>TTS does not work inside OBS browser source</em></p>
					<div class='control flex'>
						<label class='checkbox' for='fullscreenanimations'>OBS Fullscreen Animations
							<input type='checkbox' id='fullscreenanimations'/>
						</label>
					</div>
					<div class='control flex'>
						<label class='checkbox' for='darkmode'>Enable Dark Mode
							<input type='checkbox' id='darkmode'/>
						</label>
					</div>
			  </section>
			  
			</div>
		  </div>

		<section id='notifications' class='moveable'>
		<h5 class='label'>IMAGES</h5>
		<div class='obs_example notification notify is-light'>
			<img class='custom_image_notification' src='https://i.imgur.com/QONVIyz.gif'>
		</div>
		</section>

		<div class='obs_hover_only' id='obs_buttons'>
			<button class='button is-primary' id='desktop_view'>DESKTOP VIEW</button>
			<button class='button is-warning' id='obs_reset'>RESET OBS POSITIONS</button>
		</div>

		<?php include_once('animations.php'); ?>

		<script>
			window.user = "<?php if ($user) {echo $user;} else {echo 'bobmitch';}?>"; // load bobmitch if no user passed
			window.passed_player_id = "<?php echo $passed_player_id;?>";
			window.passed_player_name = "<?php echo $passed_player_name;?>";
			window.playerlist = [];
			if (passed_player_name) {
				console.log('adding passed player');
				passed_player = {};
				passed_player.char_id = passed_player_id;
				passed_player.name = passed_player_name;
				playerlist.push(passed_player);
			}
			window.claim_code = '';
			window.root = "<?php echo $root;?>";
			<?php if (!$server_claim_code && $user):?>
				window.claim_code = prompt('Unclaimed Soundpack URL! - Enter a password/passphrase to claim this URL as yours! Hitting cancel will let you play with the default "bobmitch" soundpack loaded.');
				if (window.claim_code==''||window.claim_code==null) {
					window.user = 'bobmitch'; // use default bobmitch soundpack as default for new pack
					// do nothing, not claiming yet
				}
				else {
					window.localStorage.setItem('claim_code_<?php echo $user;?>',window.claim_code);
					// todo: pass ajax request to with claim action + claim_code to self
					postAjax('', {"action":"claim","claim_code":window.claim_code}, function(data) { 
						var response = JSON.parse(data);
						console.log(response);
						if (response.success==1) {
							document.body.classList.add('claimed','authorized');
						}
					});
					document.body.classList.remove('unclaimed');
				}
			<?php endif; ?>
			
		</script>

		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
		<script src="<?php echo $root; ?>achievements.js?v=111320"></script>
		<script src="<?php echo $root; ?>character.js?v=111320"></script>
		<script src="<?php echo $root; ?>event.js?v=111320"></script>
		<script src="<?php echo $root; ?>profiles.js?v=111320"></script>
		<script src="<?php echo $root; ?>vehicles.js?v=111320"></script>
		<script src="<?php echo $root; ?>weapons.js?v=111320"></script>
		<script src="<?php echo $root; ?>zones.js?v=111320"></script>
		<script src="<?php echo $root; ?>worlds.js?v=111320"></script>
		<script src="<?php echo $root; ?>loadouts.js?v=111320"></script>
		<script src="<?php echo $root; ?>item_categories.js?v=111320"></script>
		<script src='<?php echo $root; ?>script.js?v=12620204'></script>
		
			

	</body>
</html>