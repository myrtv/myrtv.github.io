#!/bin/bash
#Convert YouTube playlists to RTV playlists.
#depends: curl (wget would probably be fine), grep, sed, wc
#Probably a fine example of the worst possible usage of grep and sed.
#Developed on MinGW, but should be fine elsewhere. WINDOWS USERS GET MINGW: http://mingw.org

#./youtube-playlists.sh https://www.youtube.com/playlist?list=ID

#Note: YouTube playlists have a cutoff point of initial items so this is intended primarily for short playlists (100 items).
#In this case, load all the items manually, save the page, then pipe it into here. (need to switch from curl)

PAGE=$(curl $1) #Optionally have this pull in file contents instead.
PLTITLE=$(echo "$PAGE" | grep -Po '(?<=<title>).*?(?= - YouTube</title>)') #Not future proof.
OUTNAME="$(echo $PLTITLE | sed -e 's/\s/_/g' -e 's/[^[:alnum:]_-]//g').min.json"

#Skip if exists, for performance.
[ -f $OUTNAME ] && echo "$PLTITLE already exists, skipping..." && exit

PAGE="$(echo "$PAGE" | echo "$(grep -Po '(data-(title|video-id)="(.*?)"|class=\"timestamp\".*<\/div>)')" | sed -e 's/"$//g')"
#data-title and data-video-id are used later to determine their ordering, timestamp is formatted immediately below.
PAGE="$(echo "$PAGE" | sed -re 's/class=\"timestamp\".*>([0-9:]+).*<\/div>/\1/g')"
LINES=$(echo "$PAGE" | wc -l)

echo
echo "Playlist: $PLTITLE"
echo

PLAYLIST=""
for ((i=1;i<$LINES;i+=3));
do
    ITEM="$(echo "$PAGE" | sed -n ${i},$(expr $i + 2)p)" #Pull out the item's three lines in a range.

    #Don't know if them swapping order is intentional, thanks HTML.
    I_FIRST=$(echo "$ITEM" | sed -n 1p)
    if [[ $I_FIRST =~ ^data-video-id ]] ; then
        I_ID=$I_FIRST
        I_TITLE=$(echo "$ITEM" | sed -n 2p)
    else
        I_ID=$(echo "$ITEM" | sed -n 2p)
        I_TITLE=$I_FIRST
    fi

    I_ID=$(echo $I_ID | sed -e 's/data-video-id="//')
    I_TITLE=$(echo $I_TITLE | sed -e 's/data-title="//' -e "s/\&#39;/'/g" -e "s/\&amp;/\&/g")
    I_DUR=$(echo "$ITEM" | sed -n 3p)

    #If I_DUR is not in \d+?:\d{2}$ format, it's probably a deleted/private video so we should skip it and update $i.
    if [[ ! $I_DUR =~ [0-9]+:[0-9]{2}$ ]] ; then
        echo "(NO DURATION - SKIPPING) $I_ID | $I_TITLE"
        i=$(expr $i - 1)
    else
        #Break down the duration
        T_DUR=${I_DUR//[^:]}
        if [ ${#T_DUR} = 1 ] ; then
            #The duration is less than an hour.
            I_SEC=$(echo $I_DUR | grep -Po '\d+$')
            I_MIN=$(echo $I_DUR | grep -Po '^\d+')
            I_SEC_TOTAL=$(expr \( $I_MIN \* 60 \) + $I_SEC)
        else
            I_SEC=$(echo $I_DUR | grep -Po '\d+$')
            I_MIN=$(echo $I_DUR | grep -Po ':\d+:' | sed -e 's/://g')
            I_HOUR=$(echo $I_DUR | grep -Po '^\d+')
            I_SEC_TOTAL=$(expr \( $I_HOUR \* 3600 \) + \( $I_MIN \* 60 \) + $I_SEC)
        fi

        echo "$(printf "%03d\n" $i) | $I_ID | $I_DUR = $I_SEC_TOTAL | $I_TITLE"
        PLAYLIST="$PLAYLIST{\"name\":\"$I_TITLE\",\"duration\":$I_SEC_TOTAL,\"qualities\":[{\"src\":\"$I_ID\"}]}"

        #Add a comma if not the last item.
        if (( $(expr $i + 3) < $LINES )) ; then
            PLAYLIST="$PLAYLIST,"
        fi
    fi
done

#We're done!
OUTJSON="{\"info\":{\"name\":\"$PLTITLE\",\"start_epoch_gtm\":0,\"end_epoch_gtm\":0,\"service\":\"youtube\"},\"playlist\": [$PLAYLIST]}"
echo $OUTJSON > $OUTNAME #I don't trust myself to write a file.
echo
echo "Playlist saved to \"$OUTNAME\""