

# Planetside Announcer
Welcome, and thanks for checking out my little webapp. :)  What does it do? Basically, 2 things:

 - Reacts to events that happen to your tracked player(s) in Planetside
   2 while you play, and plays silly sounds depending on what happened.
  - Displays images for each type of trigger event as notifications that disappear after a few seconds.

There is a live version available to try at: [https://bobmitch.com/ps2](https://bobmitch.com/ps2)

## How To Use?

Go to the site above - or install it on your own webserver - it only requires PHP 5 or greater - no database. If you clone/download this project to run on your own server, please apply for and change the service ID for all API calls to your own as a courtesy. ID's can be applied for [here](http://census.daybreakgames.com/#devSignup).

Click on 'Manage Players' and use the search facility to find your player(s) - the system will detect when they login and will begin tracking events using the [DBG API](http://census.daybreakgames.com/#what-is-websocket).

Then simply start playing planetside with the browser tab open in the background. :)

## Can I Make My Own Soundpacks?

Of course! Just go to the site and add **/soundpackname** (change to whatever you want) at the end of the URL.

Go ahead and click on 'Manage Audio' - when you make any changes to the triggers you will be prompted to enter a password/passphrase to 'claim' this URL as your own (if it has not already been claimed). You can now add custom weapon triggers, or change images/audio files for any existing triggers - and to share your soundpack, simply send interested parties to your new URL.

Note - all sounds (and images) must be loaded from an HTTPS source, with CORS enabled. Dropbox works well for images/audio. Imgur works great for images.

## Can I Use This With OBS?

Sure - just add the site as a browser source!  If OBS is detected, the site will start in OBS mode - to go back to regular mode simply tap 'space' while in 'interactive mode' in OBS. You can switch to OBS mode at any time by clicking on the more menu, and choose 'OBS View'. Items can be moved/scaled in OBS view while in interactive mode as well.

[Quick Setup Guide](https://docs.google.com/document/d/1x0GS700wFmZqSRidfKzLpTQ5AhIdwTP2_XxK_7ozA5U/edit?usp=sharing)

## Are You Looking For Suggestions?

Always. :) Either add issues here on github, or fill out the [feedback form](https://docs.google.com/forms/d/17hE2xnjiPU2DXJNRkMrO557ZeeYTCnx6lZJ7kxDYCqc/).

## Why Can't I Upload My Sounds/Images To Your Server?

I didn't want people to have to register/give up their anonymity in order to use this site, and in fact the early versions stored all of the user configuration data in localStorage to further maximize this goal. The OBS feature and ease of sharing soundpacks made some server-side shenanigans somewhat necessary.

I also didn't want to have to deal with any copyright issues that may arise other than removing links if required.

