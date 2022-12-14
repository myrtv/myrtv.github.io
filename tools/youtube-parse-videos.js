// JS YT loaded channel -> RTV playlist converter
playlist = JSON.stringify({
    info: {
        name: document.querySelector("#channel-header .ytd-channel-name").innerText,
        player: "youtube"
    },
    playlist: [...document.querySelectorAll("ytd-rich-item-renderer")]
        .reverse() // So the first item is the latest in the playlist.
        .map(item => item.__data.data.content.videoRenderer).map(item => ({
            name: item.title.runs[0].text,
            src: item.videoId,
            // Does not suport videos over 24 hours. Damn!
            duration: item.lengthText.simpleText.split(":").reverse().map(n => parseInt(n)).reduce((acc,cur,i) => acc+cur*60**i)
        }))
});

console.log(playlist)
copy(playlist)
prompt("",playlist)
