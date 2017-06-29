#!/bin/bash
while read p; do
    echo "Sending $p"
    ./youtube-playlists.sh ${p%$'\r'}
done <list.txt