//AGDQ2012 - To lazy to post diffs edition
//Compared to the original parser's target (AGDQ2013, which used "512K", "2M", "4M", "8M", etc.), 2012 uses "" (blank/missing, LQ or 240p), "HQ" (480p), and "IQ" (1280x960p).
//archive_input is an object containing the video player's pre-made playlist from the Archive's collection page.

var temp = [];

$.each(archive_input, function (index, val) {
  var item = itemParse(val);
  if (index > 0 && temp[temp.length - 1].name == item.name) {
    //Similar to previous entry
    temp[temp.length - 1].qualities.push(item.qualities[0]);

    //Sort qualities.
    var order = ['LQ', 'HQ', 'IQ'];
    temp[temp.length - 1].qualities.sort(function (a, b) {
      return (order.indexOf(a.bitrate) < order.indexOf(b.bitrate)) ? -1 : 1
    });
  } else {
    //Unique entry
    temp.push(item);
  }
});

prompt('', JSON.stringify(temp));

function itemParse(val) {
  return {
    name: val.title.match(/^\d+\. AwesomeGamesDoneQuick\d+ part\d+ (.*?)( HQ| IQ)?$/i)[1],
    duration: Math.round(val.duration),
    qualities: [
      {
        label: val.sources[0].label,
        thumbnail: val.image,
        bitrate: (val.title.match(/ ?(HQ|IQ)?$/i)[1] || "LQ"),
        size: 0,
        width: val.sources[0].width,
        height: val.sources[0].height,
        src: val.sources[0].file
      }
    ]
  }
}