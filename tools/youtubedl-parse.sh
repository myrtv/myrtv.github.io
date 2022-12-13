#!/bin/bash
#YouTube Playlist to RTV Playlist "converter" using youtube-dl.
#Shoutouts to: jq

if [[ $# -eq 0 ]] ; then
    echo 'gimme something to download'
    exit 1
fi

echo 1/3 Time varies on provider but YT is fast. Ignore any errors that may pop up.

case $1 in
    *dailymotion.com*)
        echo -e 'Dailymotion: Welcome to the \e[3mslow zone\e[0m.'
        YTDL_FLAGS="--simulate -J"
        JQ_FORMAT='{info: {name: .id, dm_playlist_id: .id, player: "dailymotion"}, playlist: [ .entries[] | {name: .title, duration: .duration, src: .id} ]}'
        ;;
    *)
        # For the minimum playlist spec, --flat-playlist gets everything needed (name, duration, ID) and is fast.
        echo -e 'Assuming YouTube/generic. \e[3mLudicrous speed\e[0m.'
        YTDL_FLAGS="--simulate --flat-playlist -J"
        JQ_FORMAT='{info: {name: .title, yt_playlist_id: .id, player: "youtube"}, playlist: [ .entries[] | {name: .title, duration: .duration, src: .id} ]}'
        ;;
esac

YTDL_TEMP=$(youtube-dl --ignore-errors $YTDL_FLAGS $1)
echo Length: ${#YTDL_TEMP} 

#TO-DO: Probably verify we got something.

#Initialize.
echo 2/3 Building playlist.
PLAYLIST=$(
  jq -c "$JQ_FORMAT" \
  <<< "$YTDL_TEMP"
)
TITLE=$(jq .id <<< "$YTDL_TEMP" | sed -E 's/\W/_/g')
RTV_OUT="rtv-${TITLE}.json"

echo 3/3 Writing output to $RTV_OUT
echo "$PLAYLIST" > "$RTV_OUT"
echo "$RTV_OUT"
