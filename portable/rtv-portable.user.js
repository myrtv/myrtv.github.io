// ==UserScript==
// @author	RePod
// @name	RTV Portable - Crunchyroll version
// @version	1.0
// @include	/https://www.crunchyroll.com/*/
// @grant	none
// ==/UserScript==

/*

    A crude, portable version of RTV intended to be used on websites that either expose a controllable player or player API.
    Hopefully with jQuery available. Generating playlists is your problem. Run with a userscript extension for easiest results.
    
    Playlist format should be: (duration in seconds, floored preffered)
    {"list": [
        {"name":"Video #1","url":"page url","duration":1234},
        {"name":"Video #2","url":"page url","duration":5678},
        ...
    ]}
    
    In the config below, either:
     - Set JSON key to path to valid JSON file (keep CORS in mind)
     - Put the JSON's list key contents into the config's list key

*/

config = { //Sample config for Crunchyroll
    buttonTarget: "#header_userpanel_beta ul",
    playerDetect: "#vilos-player",
    playerInstance: "VILOS_PLAYERJS",
    JSON: ("https://myrtv.github.io/portable/playlists/crunchyroll/"+location.pathname.split("/")[1]+".min.json").replace("-","%2D"),
    list: []
}

rtvp = {
    playlist:{list:[]},
    video: { //Abstracted functions for portability
        instance: {},
        spawn: function() { //Run when we first determine our player. i.e. disable autoplay functionality.

        },
        play: function() { this.instance.play() },
        pause: function() { this.instance.pause() },
        seek: function(sec) { this.instance.setCurrentTime(sec) },
        sync: function() { //Not recommended since it might require a page change. Use rtvp.sync().
            rtvp.needMove();
            this.seek(rtvp.currentEp().seek)
        },
        bindListener: function(bindEvent,bindCB) {
            this.instance.on(bindEvent, function() {
                bindCB();
            }, false);
        },
        unbindListener: function(bindEvent) {
            this.instance.off(bindEvent)
        }
    },
    bind: function() {
        this.video.spawn();
        this.video.unbindListener('ended');
        this.video.bindListener('ended',function() {
            rtvp.sync()
        });
    },
    tvbutton: function() {
        //For styling purposes.
        return $("<a/>", {
            id: "launchTV",
            text: "TV",
            title: this.generateTitle()
        })
        .css("cursor","pointer")
        .click((a)=>{
            if (a.ctrlKey && a.altKey) {
                var alt = prompt("Enter alternative playlist URL:\nCurrent below, empty to unset.", (localStorage.rtvpAltURL || config.JSON));
                
                if (alt.length > 0) {
                    localStorage.rtvpAltURL = alt;
                } else {
                    localStorage.removeItem("rtvpAltURL");
                }
                
                return;
            }
            
            rtvp.sync();
        })
    },
    preinit: function() {
        if (this.playlist.list.length == 0) {
            if (config.list && config.list.length > 0) {
                rtvp.playlist.list = config.list;
            } else {
                var target = (localStorage.rtvpAltURL || config.JSON);
                $.getJSON(target).then(function(a) {
                    rtvp.playlist.list = a.list;
                    rtvp.preinit();
                })
                .fail(function(a) {
                    localStorage.removeItem("rtvpAltURL");
                    prompt("Playlist loading failed.\nIf it was an alternative URL it is now shown below and will be unset.\nFor other problems, contact whoever you got the script/URL from.",target);
                    location.reload();
                })
            }
            return;
        }

        rtvp.playlist.totalDur = rtvp.playlist.list.reduce((a,b)=>a+b.duration,0);
        
        this.tvbutton().prependTo($(config.buttonTarget))

        //Automatically init if we're also auto-navigating.
        if (localStorage.rtvpmove) { rtvp.init(); }
    },
    generateTitle: function() {
        var ep = this.currentEp();
        var len = this.playlist.list.length;
        var title = `Ctrl Alt Click to set custom playlist URL.\n\n#${ep.index+1}/${len}\tNow\t\t${ep.item.name}`;

        for (var i=1,t=10;i<t;i++) {
            if (this.playlist.list[ep.index+i] == undefined) { break }
            var next = this.playlist.list[ep.index+i];
            var gap = this.playlist.list.slice(ep.index+1,ep.index+i).reduce((a,b)=>a+b.duration,0);
            var diff = ep.item.duration - ep.seek + gap;
            var D = new Date(); D.setSeconds(D.getSeconds() + diff);

            title += `\n#${ep.index+i+1}/${len}\t${D.toLocaleTimeString()}\t${next.name}`
        }

        return title;
    },
    init: function() {
        this.sync();
    },
    sync: function() {
        this.needMove();

        //Wait for player
        var wait = setInterval(function() {
            if ($(config.playerDetect).length) {
                clearInterval(wait);
                rtvp.video.instance = (typeof config.playerInstance == "object") ? config.playerInstance : window[config.playerInstance];
                rtvp.bind();
                rtvp.run();
            }
        }, 100);
    },
    needMove: function() {
        var ep = this.currentEp();

        //Navigate to video page if needed
        var target = (ep.item.url.indexOf("/") == 0) ? "pathname" : "href";
        if (location[target] !== ep.item.url) {
            localStorage.rtvpmove = 1;
            location[target] = ep.item.url;
            return;
        }
        localStorage.removeItem("rtvpmove");

        return false;
    },
    run: function() {
        var ep = this.currentEp();
        this.video.seek(ep.seek);
        this.video.play();
    },
    currentTime: function() {
        return Math.floor(new Date()/1000 - new Date(0)/1000)%this.playlist.totalDur
    },
    currentEp: function() {
        var cur = this.currentTime();
        var t = 0; var temp = [];

        $.each(this.playlist.list, function (i,v) {
            if (cur < t+v.duration) {
                temp = {seek:cur-t,item:v,index:i};
                return false;
            }
            t += v.duration;
        });

        return temp;
    }
}
rtvp.preinit();