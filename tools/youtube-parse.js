// JS YT->RTV playlist converter
V = {
    info: {
        name: document.querySelector("ytd-playlist-header-renderer #text").textContent,
        player: "youtube"
    },
    playlist: [...document.getElementsByTagName("ytd-playlist-video-renderer")].map(item =>
        ({
            name: item.__data.data.title.runs[0].text,
            duration: parseInt(item.__data.data.lengthSeconds),
            src: item.__data.data.videoId
        })
    )
};
// JSON.stringify(V) to minify
copy(V)
