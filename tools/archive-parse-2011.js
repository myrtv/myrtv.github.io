//AGDQ2011 - A classic
//archive_input is an object containing the video player's pre-made playlist from the Archive's collection page.

var temp = [];

$.each(archive_input, function (index, val) {
    var item = itemParse(val);
    if (index > 0 && temp[temp.length - 1].name == item.name) {
        //Similar to previous entry
        temp[temp.length - 1].qualities.push(item.qualities[0]);

        //Sort qualities.
        var order = ['512K', 'LQ', 'OGV'];
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
    var item = {
        name : val.title.match(/^\d+\. AwesomeGamesDoneQuick (?:part\d+ )?(.*?)$/i)[1],
        duration : Math.round(val.duration),
        qualities : []
    }

    $.each(val.sources, function (i, sval) {
        item.qualities.push({
            label : sval.label,
            thumbnail : val.image,
            bitrate : ((/(512k)b?$/i.test(val.title)) ? '512K' : (/\.ogv$/i.test(sval.file)) ? 'OGV' : 'LQ'),
            size : 0,
            width : sval.width,
            height : sval.height,
            src : sval.file
        })
    });

    return item;
}