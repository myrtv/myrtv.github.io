#!/bin/bash
#YouTube Playlist to RTV Playlist "converter" using youtube-dl.
#Shoutouts to: jq

if [[ $# -eq 0 ]] ; then
    echo 'gimme something to download'
    exit 1
fi

#TO-DO: dynamic filenames
YTDL_TEMP=rtv-temp.json
RTV_OUT=rtv-new.json 

rm $YTDL_TEMP

#I wish there was a faster way than dumping EVERYTHING (a lot useful, but equally useless) but still being in an accessible format.
#Originally the title, id, and duration were obtained individually and read back in groups of 3 lines at a time. Ouch.
echo 1/3 This may take a while based on playlist length. Ignore any errors that may pop up.
youtube-dl --ignore-errors --skip-download -j $1 > $YTDL_TEMP

#TO-DO: Probably verify we got something.

#Read first line and initialize.
echo 2/3 Building playlist.
PLAYLIST=$(echo $(head -n1 $YTDL_TEMP) | jq '{info: {name: .playlist_title, yt_playlist_id: .playlist_id, player: "youtube"}, playlist: []}')

#What can't jq do
while read -r line; do
    INFO=$(echo "$line" | jq -c '{name: .fulltitle, duration: .duration, src: .display_id}')
    PLAYLIST=$(echo "$PLAYLIST" | jq -c --argjson i "$INFO" '.playlist += [$i]' )
done < $YTDL_TEMP

echo 3/3 Writing output to $RTV_OUT
echo "$PLAYLIST" > $RTV_OUT

rm $YTDL_TEMP