//Parsing the "Videos" tab. Must load all items manually.

playlist = [];

$(".yt-shelf-grid-item").each(function (index, item) {
  var a = $(item).find(".video-time").text().split(':');
  playlist.push({
    "name": $(item).find(".yt-lockup-title a").text(),
    "duration": (+a[a.length-1])+(+a[a.length-2]*60)+((a.length==3)?(+a[a.length-3]*3600):0), //Why
    "qualities": [{
    "src": $(item).find(".yt-lockup").data("context-item-id")
  }]
  })
})
playlist.reverse(); //Flip the playlist, so the newest upload is last and vice-versa.

prompt('', JSON.stringify(playlist));