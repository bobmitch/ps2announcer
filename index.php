<?php 

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

// get user
$user = false;
$passed_player_id = false;
$passed_player_name = false;

if (sizeof($segments)>0) {
	// user = audio pack user
	if (ctype_alnum ($segments[0])) {
		if (strlen($segments[0]<16)) {
			$user = $segments[0];
		}
	}
	if (sizeof($segments)>1) {
		// got player id too
		if (ctype_digit($segments[1])) {
			$passed_player_id = $segments[1];
		}
	}
	if (sizeof($segments)>2) {
		// got player id too
		if (ctype_alnum($segments[2])) {
			$passed_player_name = $segments[2];
		}
	}
}

$config_json_path = false;
if (file_exists('userconfigs/' . $user . '_config.json')) {
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
		if ($submitted_claim_code!=$server_claim_code) {
			echo '{"success":0,"msg":"Incorrect password/passphrase!"}';
			exit(0);
		}
		else {
			$config = get_post('config');
			$valid_json = json_decode($config);
			if ($valid_json) {
				file_put_contents('userconfigs/' . $user . '_config.json',$config);
				echo '{"success":1,"msg":"saved"}';
			}
			else {
				echo '{"success":0,"msg":"invalid config"}';
			}
		}
	}
	elseif ($action=='claim') {
		if ($submitted_claim_code && $user) {
			file_put_contents ('userconfigs/' . $user . '_claim.txt',$submitted_claim_code);
			echo '{"success":1,"msg":"claimed"}';
		}
		else {
			echo '{"success":0,"msg":"not claimed"}';
		}
	}
	exit(0); // don't progress beyond this point if API call :)
	?>
<?php endif; ?>

<?php // END OF API ?>

<html>
	<head>
		<title>Planetside Announcer - beta!</title>
		<meta charset="UTF-8">
		<meta name="description" content="Planetside 2 Announcer">
		<meta name="keywords" content="planetside, announcer, funny">
		<meta name="author" content="Bob Mitchell">
		<link rel="stylesheet" href="<?php echo $root;?>style.css">
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@0.9.0/css/bulma.css" integrity="sha256-oSsWW/ca1ll8OVu2t4EKkyb9lmH0Pkd8CXKXnYP4QvA=" crossorigin="anonymous">
		<link rel="icon" type="image/png" href="https://bobmitch.com/ps2/favicon.ico">
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
	<body class='<?php if ($server_claim_code) {echo " claimed ";}?> <?php if (!$server_claim_code) {echo " unclaimed ";}?> <?php if (!$user) {echo " vanilla ";}?>'>
		<div id='splash' class='notobs'>
			<div class='contain'>
				<h1 class='splashtitle'>Planetside 2 Announcer</h1>
				<button onclick='document.querySelector("#splash").classList.add("hide");allow_voicepack();' class='button btn is-warning is-large'>Enable Audio / Start</button>
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

				  
				  <div class='navbar-item' id="soundpack">
				  	  <i class="fas fa-volume-up"></i>&nbsp;
					  <span title='Currently loaded soundpack' data-char_id="0" id='soundpackname' class='tag is-white is-light'><?php if ($user) {echo $user;} else {echo 'BobMitch';}?></span>
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
							<a id='show_feedback_modal' class="navbar-item">
							  Feedback
							</a>
							<!-- <a id='show_export_modal' class="navbar-item">
								Export/Import Soundpack
							  </a> -->
							  <a id='toggle_view' class="navbar-item">
								OBS View (space to revert)
							  </a>
						</div>
					</div>
					<div class="navbar-item">
					  <div class="buttons">

						
						
						<a id='show_achievements_modal' class="button is-info">
							<strong><i class="fas fa-volume-up"></i> Manage Triggers</strong>
						  </a>
						  <a id='show_player_modal' class="button is-primary">
							<strong><i class="fas fa-users"></i> Manage Players</strong>
						  </a>
					  </div>
					</div>
				  </div>
				</div>
			  </nav>

			

			<div id='stats' class="field is-grouped is-grouped-multiline">
				<div class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">Bodyshot Streak</span>
						<span data-variable='bodyshotkillstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">HS Streak</span>
						<span data-variable='headshotstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">Killstreak</span>
						<span data-variable='killstreak' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				<div class="control">
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
				<div class="control">
					<div class="tags has-addons">
						<span class="tag is-dark">K/D</span>
						<span data-variable='kd' class="autoupdate tag is-info">0</span>
					</div>
				</div>
				
			</div>
			
			<ul id="messages"></ul>

			<table class='table is-fullwidth' id='events'>
				<thead>
					<tr>
						<th>Time</th>
						<th>Event</th>
						<th>Special</th>
					</tr>
				</thead>
				<tbody id='events_body'>
				</tbody>
			</table>

			
		</div>

		<div id='playermodal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Manage Players</p>
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
				<p class="modal-card-title">Manage Triggers <i title='URL already claimed' class="claimedonly fas fa-lock"></i>&nbsp;&nbsp;&nbsp;&nbsp;<button id='add_custom_trigger' class='button btn is-small is-primary'>Add Custom Weapon Trigger</button></p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
				<div class='control flex'>
					<label  for='volume'>Global Volume: </label>
					<div>
						<input type="range" id="volume" name="volume" value="100" min="0" max="100"/> 
					</div>
				</div>
				<hr>
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
				<p>Any external audio files must be hosted on HTTPS (secure) sites. Dropbox links can be used by changing up the shared URL slightly:</p>
				<p>If the original shared URL is:</p>
				<p><em>https://www.dropbox.com/s/l8ko7l9c7rxuh7m/payback%27s-a-bitch-ain%27t-it.mp3?dl=0</em></p>
				<p>just change the www to dl, and remove everything after mp3 - so in this example it would become:</p>
				<p>https://dl.dropbox.com/s/l8ko7l9c7rxuh7m/payback%27s-a-bitch-ain%27t-it.mp3</p>
				<hr>
				<p>If you are serving up audio files from your own webserver, you may need to allow this domain to access your files.</p>
				<p>For Apache add: <span class='code'>Header set Access-Control-Allow-Origin "https://bobmitch.com"</span> to your .htaccess file.</p>
				<p>For nginx see <a target='_blank' href='https://enable-cors.org/server_nginx.html'>these instructions</a>. Be sure to replace the wildcard '*' with 'bobmitch.com' for added security.</p>
				<hr>
				<p><strong>Any custom sounds add to built-in triggers will prevent default sounds from playing!</strong></p>
			  </section>
			  
			</div>
		  </div>

		  <div id='feedback_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Feedback</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
				<iframe src="https://docs.google.com/forms/d/e/1FAIpQLScsWiI1_GUhgXrBiK4fN7JqBZpHCzOfmbL4VvC2S8m_BnHnpA/viewform?embedded=true" width="640" height="737" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
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
							<label class="label">Image URL</label>
							<div class="control">
							  <input id='custom_image_url' name='custom_image_url' class="input" type="text" placeholder="Image URL">
							</div>
							<p class="help">Must be hosted on HTTPS site, and have CORS enabled</p>
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

		  <div id='export_modal' class="modal">
			<div class="modal-background"></div>
			<div class="modal-card">
			  <header class="modal-card-head">
				<p class="modal-card-title">Import/Export Soundpack</p>
				<button class="delete" aria-label="close"></button>
				
			  </header>
			  <section class="modal-card-body">
				<textarea id='config_export'>

				</textarea>
				<br>
					<button type='button' href='#' id='copy_config' class='button is-light is-info'>
						
						  <span>Copy Config</span>
					</button>
					<button type='button' href='#' id='apply_config' class="button notobs is-info">
						<strong>Apply Config</strong>
					</button>
					<button type='button' href='#' id='paste_config' class='obsonly button is-info is-warning'>
						
						<span>Paste Config</span>
				  </button>
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
					<p>First of all, this is <em>not</em> a replacement for Recursion's stat tracker application - there is no  crosshair overlay, permanent stat tracking, achievement logging, or any of the myriad cool things that software offers - 
					this is simply just fun little web project to make funny noises when funny things happen in Planetside 2 without having to install any applications or 
					register with any third-party sites.</p>
					<p>At the time of writing, this site is not intended for widespread public consumption - bugs are plentiful and the experience may break at any second, so don't get mad if things don't work, and don't share this <em>too</em> far and wide until it becomes a bit more polished! </p>
					<p>Please use the feedback for to give suggestions or report problems - thanks!</p>
					<hr>
					Special thanks to <a href="https://twitch.tv/myian" target="_blank">Myian</a> for help with testing, debugging and suggestions.
					<hr>
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

		<section id='notifications'>
		</section>

		<div id='animations' class='obs_only'>

		</div>

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
					});
					document.body.classList.remove('unclaimed');
				}
			<?php endif; ?>
			
		</script>

		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
		<script src="<?php echo $root; ?>achievements.js"></script>
		<script src="<?php echo $root; ?>character.js"></script>
		<script src="<?php echo $root; ?>event.js"></script>
		<script src="<?php echo $root; ?>profiles.js"></script>
		<script src="<?php echo $root; ?>vehicles.js"></script>
		<script src="<?php echo $root; ?>weapons.js"></script>
		<script src="<?php echo $root; ?>loadouts.js"></script>
		<script src="<?php echo $root; ?>item_categories.js"></script>
		<script src='<?php echo $root; ?>script.js'></script>
		
	</body>
</html>