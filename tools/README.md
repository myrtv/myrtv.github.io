Need help picking one?

## [parseyoutube.js](parseyoutube.js)
 - Easiest, one playlist at a time.
 - Visit the actual playlist page on YouTube. (`https://www.youtube.com/playlist?list=STUFF`)
 - If there are more than 100 items, make sure you can see them all.
 - Open your browser's console (Firefox: Ctrl+Shift+K, Chrome: Ctrl:Shift+J), paste the contents, and submit.
 - A window will pop up, the textbox contains the playlist.

## [youtube-playlists.sh](youtube-playlists.sh)
 - For experts and bulk playlist generation.
   - If you don't understand the following, this is not for you.
 - Runs in a CLI/shell/terminal/command prompt/etc.
   - Windows users will need [MinGW](http://mingw.org/)
   - Requires: `curl` (`wget` would probably be fine), `grep`, `sed`, `wc`
 - Mark executable then `./youtube-playlists.sh https://www.youtube.com/playlist?list=STUFF`
 - Will generate the playlist based off the provided URL and save it to a file.
 - Has a hard-limit of 100 playlist items, unless the actual page is saved manually with all items then fed in.
 
## The rest
 - Scraping Archive.org's GDQ collections (the file names changed yearly)
   - All these require jQuery available, too lazy to convert to vanilla JavaScript
   - [parsearchive_2011.js](parsearchive_2011.js)
   - [parsearchive_2012.js](parsearchive_2012.js)
   - [parsearchive_2013.js](parsearchive_2013.js)
   - [parsearchive_2014+.js](parsearchive_2014+.js)
 - [parseyoutube-oldjquery.js](parseyoutube-oldjquery.js)
   - Same as [parseyoutube.js](parseyoutube.js) but requires jQuery and is outdated.
   - Eventually this will be deleted.
 - [parseyoutube-videos.js](parseyoutube-videos.js)
   - Parses the Videos tab of a channel instead of a playlist to generate a playlist.
   - Requires jQuery. Will eventually be deleted in favor of a jQuery-free version.
