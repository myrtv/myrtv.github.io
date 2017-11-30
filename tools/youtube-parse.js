//JS YT->RTV playlist converter (new layout)
R = document.getElementsByTagName("ytd-playlist-video-renderer"), T = document.getElementsByClassName("title")[0].innerText, V = {
    info: {
        name: T,
        service: "youtube"
    },
    playlist: []
};
for (i = 0; i < R.length; i++) {
    V.playlist.push({
        name: R[i].__data__.data.title.simpleText,
        duration: parseInt(R[i].__data__.data.lengthSeconds),
        qualities: [{ src: R[i].__data__.data.videoId }]
    })
};
Q = JSON.stringify(V);
console.log(Q);
prompt(T, Q);
void(0)