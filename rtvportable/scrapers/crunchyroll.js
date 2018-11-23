/*
    Crunchyroll series scraper. Based god for metadata on the page.
    Run on series episode list page.
*/

var list = {list: []}
var t = $(".episode");

function run() {
    var ep = $(t.splice(0,1)[0]).attr("href");
    $.get(ep).then(a=>{
        //Using regex to parse HTML, of course.
        list.list.push({
            name: a.match(/"name":"(.+?)","/).pop(),
            url: ep,
            duration: parseInt(a.match(/duration":(\d+)/).pop())
        });
        run();
    });
}
run()

//list.list.reverse();