//Parsing a playlist. Must load all items manually.

playlist = [];

$(".pl-video.yt-uix-tile").each(function (index, item) {
  var a = $(item).find(".timestamp span").text().split(':');
  playlist.push({
    "name": $(item).data("title"),
    "duration": (+a[a.length-1])+(+a[a.length-2]*60)+((a.length==3)?(+a[a.length-3]*3600):0), //Why
    "qualities": [{
    "src": $(item).data("video-id")
  }]
  })
})

prompt('', JSON.stringify(playlist));