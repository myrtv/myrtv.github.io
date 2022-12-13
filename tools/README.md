If something is broken move down the list. If they're all broken notify me.

### [youtube-parse.js](youtube-parse.js)
 - Easiest, one playlist at a time.
 - Visit the actual playlist page on YouTube. (`https://www.youtube.com/playlist?list=STUFF`)
 - Load all desired videos to grab by clicking *[Load more]* at the bottom.
   - For YouTube playlists with more than 100 items.
 - Open your browser's console (Firefox: `Ctrl+Shift+K`, Chrome: `Ctrl+Shift+J`), paste the contents, and submit.

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
   
### [youtubedl-parse.sh](youtubedl-parse.sh) (most reliable)
 - Best chance that it still works, but familiarity with shell recommended.
 - Requires bash, youtube-dl, and jq installed.
 - Technically supports whatever YTDL does, like Dailymotion.
 - At the time of writing it's a relatively new script. Not a lot of features.
 - Slow and steady because I'm tired of caring about design changes.
    - I was and am well aware of the pitfalls of the above.
    
### [archive-parse.js](archive-parse.js)
 - Convert a given Archive.org ID to an RTV playlist.
 - Sorting is based on Archive.org's.
 - No Collection support ("yet").
   
There's some other stuff in the *deprecated* folder, but...
