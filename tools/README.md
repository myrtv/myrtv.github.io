Need help picking one?

### [youtube-parse.js](youtube-parse.js)
 - Easiest, one playlist at a time.
 - Visit the actual playlist page on YouTube. (`https://www.youtube.com/playlist?list=STUFF`)
 - Load all desired videos to grab by clicking *[Load more]* at the bottom.
   - For YouTube playlists with more than 100 items.
 - Open your browser's console (Firefox: `Ctrl+Shift+K`, Chrome: `Ctrl+Shift+J`), paste the contents, and submit.
 - A window will pop up, the textbox contains the playlist.
   - If the result is cut off in the text box, it is also available from the console.
   - If obtained from the console **do not copy** the start and end double-quotes: `"`, your copy should start and end with `{ }`.
 
### [youtube-parse-videos.js](youtube-parse-videos.js)
 - Same as above, but parses the Videos tab of a channel instead of a specific YouTube playlist.
 - Visit the desired Videos tab on YouTube. (`https://www.youtube.com/user/USERNAME/videos`)
 - Load all desired videos to grab by clicking *[Load more]* at the bottom.
   - For YouTube channels with more than 30 videos.
 - Open your browser's console (Firefox: `Ctrl+Shift+K`, Chrome: `Ctrl+Shift+J`), paste the contents, and submit.
 - A window will pop up, the textbox contains the playlist.
   - The end result is flipped, so the oldest/last video is the first in the generated playlist.
   - If the result is cut off in the text box, it is also available from the console.
   - If obtained from the console **do not copy** the start and end double-quotes: `"`, your copy should start and end with `{ }`.

### [youtube-playlists.sh](youtube-playlists.sh)
 - For experts and bulk playlist generation.
   - If you don't understand the following, this is not for you.
 - Runs in a CLI/shell/terminal/command prompt/etc.
   - Windows users will need at *best* [MinGW](http://mingw.org/), Windows 10's Ubuntu subsystem is untested.
   - Requires: `curl` (`wget` would probably be fine), `grep`, `sed`, `wc`
 - Mark executable then `./youtube-playlists.sh https://www.youtube.com/playlist?list=STUFF`
 - Will generate the playlist based off the provided URL and save it to a file.
 - Has a hard-limit of 100 playlist items, unless the actual page is saved manually with all items then fed in.
   - Quick and easy solution would be a watch folder.
   
```
curl https://raw.githubusercontent.com/myrtv/myrtv.github.io/master/tools/youtube-playlists.sh -o youtube-playlists.sh
chmod +x ./youtube-playlists.sh && ./youtube-playlists.sh https://www.youtube.com/playlist?list=STUFF
```
 
### The rest

 - Scraping Archive.org's GDQ collections (the file names changed yearly)
   - All these require jQuery available, too lazy to convert to vanilla JavaScript
   - [archive-parse-2011.js](archive-parse-2011.js)
   - [archive-parse-2012.js](archive-parse-2012.js)
   - [archive-parse-2013.js](archive-parse-2013.js)
   - [archive-parse-2014+.js](archive-parse-2014+.js)
