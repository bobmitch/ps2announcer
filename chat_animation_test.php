<html>
  <head>
    <script src="https://cdn.jsdelivr.net/npm/comfy.js@latest/dist/comfy.min.js"></script>
    <link rel="stylesheet" href="/ps2/style.css">
  </head>
  <body class='obs'>
    <?php include_once('animations.php'); ?>
    <script type="text/javascript">
        ComfyJS.onCommand = ( user, command, message, flags, extra ) => {
            if( flags.broadcaster && command === "list" ) {
                let animations = document.querySelectorAll('.animation');
                animations.forEach(animation => {
                    let name = animation.id.split('_')[1];
                    console.log('!animation_'+name);
                });
            }
            if( flags.broadcaster && command.includes ("animation_" )) {
                let animation_name = command.split('_')[1];
                console.log('Playing animation ' + animation_name);
                trigger_animation(animation_name);
            }
        }
        ComfyJS.Init( "BobMitch" ); // twitch channel name
    </script>

    <script>
    function trigger_animation(trigger_id, force=false) {
        // make animation, if available, active 
        animation_el = document.getElementById('animation_' + trigger_id); // e.g. animation_roadkill
        if (animation_el) {
            // ooh, we have an animation
            // todo - check if animations are turned on
            animation_el.classList.add('active');
            // retrigger css animation by cloning element - https://css-tricks.com/restart-css-animation/
            var newone = animation_el.cloneNode(true);
            animation_el.parentNode.replaceChild(newone, animation_el);

            // remove active after 4 seconds
            // check for previous timer and clear and replace
            index = 'animation_timeout_for_'+trigger_id;
            //console.log(index);
            if (window.hasOwnProperty(index)) {
                if (window[index]!==null) {
                    //console.log('clearing running animation timeout');
                    clearTimeout(window[index]); // clear old timer, extending 4 second window
                }
            }
            window[index] = setTimeout(function(trigger_id){
                animation_el = document.getElementById('animation_' + trigger_id);
                animation_el.classList.remove('active');
                window['animation_timeout_for_'+trigger_id]=null; // clear anim for starting again
            }, 5000, trigger_id); // max animation length of 4 seconds, then active removed
        }
    }
    </script>


  </body>
</html>