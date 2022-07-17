

# Planetside 2 Announcer
Welcome, and thanks for checking out my little webapp. :)  What does it do? Basically, 2 things:

 - Reacts to events that happen to your tracked player(s) in Planetside
   2 while you play, and plays silly sounds depending on what happened.
  - Displays images for each type of trigger event as notifications that disappear after a few seconds.

There is a live version available to try at: [https://bobmitch.com/ps2](https://bobmitch.com/ps2)

## How To Use?

Click on 'Manage Players' and use the search facility to find your player(s) - the system will detect when they login and will begin tracking events using the [DBG API](http://census.daybreakgames.com/#what-is-websocket).

Then simply start playing planetside with the browser tab open in the background. :)

## Can I Make My Own Soundpacks?

Of course! Just go to the site and add **/soundpackname** (change to whatever you want) at the end of the URL.

Go ahead and click on 'Manage Audio' - when you make any changes to the triggers you will be prompted to enter a password/passphrase to 'claim' this URL as your own (if it has not already been claimed). You can now add custom weapon triggers, or change images/audio files for any existing triggers - and to share your soundpack, simply send interested parties to your new URL.

Imgur works great as a host for images.

## Can I Use This With OBS?

Sure - just add the site as a browser source!  If OBS is detected, the site will start in OBS mode - to go back to regular mode simply tap 'space' while in 'interactive mode' in OBS. You can switch to OBS mode at any time by clicking on the more menu, and choose 'OBS View'. Items can be moved/scaled in OBS view while in interactive mode as well.

[Quick Setup Guide](https://docs.google.com/document/d/1x0GS700wFmZqSRidfKzLpTQ5AhIdwTP2_XxK_7ozA5U/edit?usp=sharing)

## Are You Looking For Suggestions?

Always. :) Either add issues here on github, or join myself and all the testers/users at [my Discord server](https://discord.gg/m9cm26).

## Why Can't I Upload My Images To Your Server?

Images (animated gifs especially) are typically much larger than short audio clips, and images are not the primary focus of this app, which is making stupid noises. 
Imgur is great for hosting images, and I use their links for the default gifs.


