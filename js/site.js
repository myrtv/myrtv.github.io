var rtv = {
    offset: 0, //Global sync offset. Tempted to make per-player offsets.
    preinit: async function() {
        var that = this;

        $("body").append($("<div />", {id: 'container'}).append(this.menu.spawn()));

        await this.config.init();

        switch (location.hash.substring(1)) {
            case "?custom":
                rtv.guide.channels.custom.open(true);
                break;
            default:
                break;
        }

        this.init();
    },
    about: function() {
        var about = '<div title="About RTV">'+
                    '<a href="https://github.com/myrtv/myrtv.github.io" target="_blank">GitHub Repository</a> (submit bugs/requests here)'+
                    '<br><br>Made with jQuery, jQuery UI, Font Awesome, Moment.js, and seedrandom.js (if available)</div>';

        $(about).dialog({
            autoOpen: true,
            height: "auto",
            width: "auto",
            modal: true,
            buttons: {
                "Clear Local Storage": function() { localStorage.clear(); location.reload(); },
            },
            open: function(event, ui){
                $(this).parent().find('.ui-dialog-title').prepend("<img src='favicon.png' style='display:inline-block'/> ");
            },
            close: function() {}
        });

        $(about).find("button").button();
    },
    config: {
        init: async function() {
            var that = this;

            this.load();

            await this.repos();
            this.local();
            this.customs();

            this.defaultPlaylists = this.defaultPlaylists.concat(this.extraPlaylists).sort();

            this.save();
        },
        local: function() {
            if (!this.cache.playlists || this.cache.playlists.length == 0) {
                console.warn('Loaded config.cache.playlists did not exist or was empty, setting default.');

                this.cache.playlists = this.defaultPlaylists;
            }
        },
        customs: function() {
            var temp = [];

            //Instate custom playlists
            for (i in rtv.player.cached_playlists) {
                if (/^custom\d+$/.test(i)) {
                    delete rtv.player.cached_playlists[i]
                }
            }

            if (localStorage.rtvCustomPlaylists && localStorage.rtvCustomPlaylists.length > 0) {
                $.each(JSON.parse(localStorage.rtvCustomPlaylists), function(i,v) {
                    rtv.player.playlist.generate({name:"custom"+i,list:v});
                    temp.push("custom"+i);
                })
            }

            this.cache.customs = temp;

            return temp;
        },
        cache: {},
        repoCache: {},
        config: {},
        load: function() {
            if (localStorage['rtvConfig']) {
                this.cache = $.extend(this.cache,JSON.parse(localStorage['rtvConfig']));
            }
        },
        save: function() {
            localStorage['rtvConfig'] = JSON.stringify(this.cache);
        },
        repos: async function() {
            var list = ["./playlists/repo.json"];

            for (repo of list) {
                try {
                    var data = await fetch(repo, {headers: {"Content-Type": "application/json"}}).then(r=>r.json())
                    data.path = new URL(repo, document.baseURI).href;
                    data.path = data.path.substr(0, data.path.lastIndexOf('/')+1);

                    this.repoCache[data.id] = data;

                    data.defaultPlaylists = data.defaultPlaylists.map(i=>`${data.id}:${i}`)
                    data.extraPlaylists = data.extraPlaylists.map(i=>`${data.id}:${i}`)

                    $.extend(this.defaultPlaylists, data.defaultPlaylists)
                    $.extend(this.extraPlaylists, data.extraPlaylists)
                } catch (e) {
                    console.error(`Could not load ${repo}`, e)
                }
            }
        },
        defaultPlaylists: [],
        extraPlaylists: []
    },
    init: function(path) {
        this.player.create(path);
    },
    player: {
        players: [], //{name: "player-0", type: "html5", instance{}, cache[]}
        findNeedle: function(item) {
            var originalUrl = item.info.url;
            var url = originalUrl.replace(/(\.(min|json))+$/ig,"");
            var candidates = rtv.config.defaultPlaylists;
            var backstep = -1;
            var needle = ""
            var expand = false;

            while (candidates.length !== 1) {
                var newCandidates = []
                needle = url.split("/").splice(backstep).join("/").toLowerCase();

                candidates.find(function(e) {
                    if (e.toLowerCase().indexOf(needle) >= 0) {
                        newCandidates.push(e)
                    }
                });

                if (backstep < -10 && newCandidates.length == candidates.length) {
                    console.warn("stalemate",needle)
                    return needle;
                    break;
                }

                if (expand == false && newCandidates.length == 2) {
                    console.warn("collision? expanding needle",newCandidates)
                    expand = true;
                    backstep = -1;
                    url = originalUrl;
                } else {
                    candidates = newCandidates;
                    backstep--;
                }
            }

            return needle;
        },
        create: function(path) {
            var last = localStorage['rtvLastPlaylist'];

            if ($.inArray(last,rtv.config.cache.playlists) == -1 && $.inArray(last,rtv.config.cache.customs) == -1) {
                console.warn('Last playlist, "'+last+'", is not in config cache. Ignoring.');
                last = false;
            }

            //URL hash
            var hash = location.hash.substring(1);
            var target = rtv.config.defaultPlaylists; //TO-DO, make configurable: user's playlists: rtv.config.cache.playlists
            hash = (hash.length > 0) ? target.find(function(e) { return (e.toLowerCase().indexOf(hash.toLowerCase()) >= 0) }) : false;
            if (hash && rtv.config.cache.playlists.indexOf(hash) < 0) {
                rtv.config.cache.playlists.push(hash);
            }

            var list = (path || hash || last || rtv.config.cache.playlists[Math.floor((Math.random()*rtv.config.cache.playlists.length))]),
                that = this;

            $.each(rtv.config.cache.playlists.concat(rtv.config.cache.customs), function (index, item) {
                var cb = (item == list) ? function() {
                    localStorage['rtvLastPlaylist'] = list;
                    that.spawn(item)
                } : false;
                that.playlist.generate(item, cb);
            });
        },
        cached_playlists: {},
        playlist: {
            generate: function(list, callback) {
                var store = list,
                    that = this;
                    list = rtv.config.repoCache[list.split(":")[0]].path + list.split(":").pop()

                if (rtv.player.cached_playlists[store] && callback) { callback(); }

                if (typeof list == "object") {
                    rtv.player.cached_playlists[list.name] = that.generateStore(list.name,list.list);
                    if (callback) { callback(); }
                } else {
                    $.ajax({
                        dataType: "json",
                        url: list,
                        beforeSend: function(jqXHR) { jqXHR.overrideMimeType('text/html;charset=iso-8859-1'); },
                        success: function (data) {
                            var playlist = (data.playlist) ? data : JSON.parse(data.responseText);
                            rtv.player.cached_playlists[store] = that.generateStore(store,playlist);
                            if (callback) { callback(); }
                        }
                    });
                }
            },
            generateStore: function(store,playlist) {
                playlist.info.url = store;
                playlist.info.total_duration = 0;
                $.each(playlist.playlist, function (index, key) {
                    playlist.info.total_duration += key.duration;
                });

                var start_epoch = new Date((playlist.info.start_epoch_gtm || 0) * 1000),
                    start = (Math.floor(new Date() / 1000)) - Math.floor(start_epoch / 1000),
                    total_duration = playlist.info.total_duration,
                    loops = Math.ceil(start / total_duration);

                if (playlist.info.shuffle == true) {
                    if (typeof Math.seedrandom == "function") {
                        //In-place shuffle: https://bost.ocks.org/mike/shuffle/
                        var m = playlist.playlist.length, t, i;
                        Math.seedrandom(loops);
                        while (m) {
                            var r = Math.random();
                            i = Math.floor(r * m--);
                            t = playlist.playlist[m];
                            playlist.playlist[m] = playlist.playlist[i];
                            playlist.playlist[i] = t;
                        }
                    } else {
                        console.warn(store, "seedrandom is not available, cannot shuffle.")
                    }
                }

                //Don't like this here, but there's seemingly no better place to re-index especially after shuffle.
                $.each(playlist.playlist, function (index, key) {
                    playlist.playlist[index].index = index;
                });

                //Chat
                //channelName = store.replace(/(^playlists\/|(\.min)?\.json$)/g, "").split("/").pop().replace(/[\W]/g, "-"),
                var channelLen = 50,
                    channelName = "rtv"+(loops % 9999)+rtv.player.findNeedle(playlist).substring(0, channelLen),
                    nick = "&nick=Kappa....",
                    channels = "&channels="+channelName,
                    config = "&prompt=1&uio=MTY9dHJ1ZSYzPWZhbHNlJjk9dHJ1ZSYxMD10cnVlJjExPTIxNSYxMz1mYWxzZSYxND1mYWxzZQ9e";
                playlist.info.chat = "https://qchat.rizon.net/?"+nick+channels+config

                return playlist
            },
            utilities: {
                getCurrentTime: function() {
                    var start_epoch = new Date((this.cache.info.start_epoch_gtm || 0) * 1000),
                        start = (Math.floor(new Date() / 1000)) - Math.floor(start_epoch / 1000),
                        total_duration = this.cache.info.total_duration,
                        loops = Math.ceil(start / total_duration);

                    start %= total_duration;

                    //console.log("Loop "+loops+" ("+total_duration+"secs/loop), beginning "+start_epoch.toString()+".\n"+
                    //          "Our current progress through it is "+Math.round(start/total_duration * 100)+"%.");

                    return start;
                },
                getCurrentVideo: function() {
                    var current_total = 0;
                    var current_time = this.getCurrentTime();
                    var the_key = {};

                    $.each(this.cache.playlist, function (index, key) {
                        if (current_time < current_total + key.duration) {
                            the_key = key;
                            if (!the_key.src) { //Temp until converted
                                the_key.src = key.qualities.pop().src
                            }
                            the_key.seek_to = current_time - current_total;
                            return false;
                        } else {
                            current_total += key.duration;
                        }
                    });

                    return the_key;
                },
                getCurrentPlayer: function() {
                    return (this.getCurrentVideo().player || this.cache.info.player || "html5")
                },
                getNextVideo: function() {
                    var n = this.getCurrentVideo().index + 1;
                    return this.cache.playlist[n==this.cache.playlist.length ? 0 : n]
                },
                getNextPlayer: function() {
                    console.log("NV:",this.getNextVideo());
                    return (this.getNextVideo().player || this.cache.info.player || "html5")
                },
                generatePlaylistFromIndex: function(index) {
                    var playlist = this.cache.playlist;
                    var select = $("<select />", {class: "guide"});
                    var time = moment().subtract(this.getCurrentVideo().seek_to, 'seconds');
                    var timeFormat = 'MM/DD hh:mmA'; //Moment.js time format

                    $.each(playlist, function (i, item) {
                        if (i >= index) {
                            $("<option />", {
                                text: time.format(timeFormat) + "\t" + item.name,
                            }).appendTo(select);

                            time.add(item.duration, 'seconds');
                        }
                    });

                    //One more item for the playlist's ending time.
                    $("<option />", {
                        text: time.format(timeFormat) + "\t" + "End of playlist.",
                    }).appendTo(select);

                    return select;
                },
                swapInstance: function (to) {
                    console.log("need to switch from",this.type,"to",this.getCurrentPlayer())
                    this.destroy(true);
                    $.extend(this, rtv.player.instance[this.getCurrentPlayer()])
                    this.done = false;
                    this.init(this.name);
                }
            }
        },
        spawn: function(path) {
            if (!path && !this.cached_playlists[path]) { return false ; }

            localStorage['rtvLastPlaylist'] = path;
            var playlist = this.cached_playlists[path];
            location.hash = this.findNeedle(playlist);
            var that = rtv.player;
            var i = that.players.length;
            var name = "player-"+i;

            $("<i />", {class: "fa fa-repeat", title: playlist.info.name}).data({"url":playlist.info.url}).click(function() {
                //Duped from guide
                rtv.player.destroy.player($("#container > [id^=window-player-]").data("player-index"));
                rtv.player.spawn(playlist.info.url);
                //rtv.guide.close();
            })//.prependTo("#recents"); //TO-DO: ALSO PERFECT.

            //Initialize the new player
            var player = {
                "index": i,
                "name": name,
                "cache": playlist,
                "instance": {}
            }
            player.test = function () {
                console.log('it\'s a mystery');
            }

            //Create parent container (especially for YouTube, but we'll need it later anyway even for HTML5)
            $("<div />", {id: "window-"+name}).data({"player-index": i}).append($("<div />", {id: name})).appendTo("#container");

            //Determine current player instance
            $.extend(player, that.playlist.utilities)

            switch ((player.getCurrentVideo().player || player.cache.info.player || "html5")) {
                case "youtube":
                    $.extend(player, that.instance.youtube);
                    break;
                case "dailymotion":
                    $.extend(player, that.instance.dailymotion);
                    break;
                case "html5":
                case "h5":
                case "":
                default:
                    $.extend(player, that.instance.html5);
            }

            player.init(name);
            rtv.player.players.push(player);

            //TO-DO: Make configurable
            $("#container").append('<div id="chat" class="closed"><iframe data-src="'+player.cache.info.chat+'"></iframe></div>')

            return i;
        },
        destroy: {
            all: function() {
                var that = this;

                $.each(rtv.player.players, function (i, player) {
                    that.player(i);
                });
            },
            player: function(player) {
                if (typeof player == "number") {
                    if (!rtv.player.players[player]) return -1;
                    player = rtv.player.players[player];
                } //Wew.
                if (player == null) return -1;

                switch (player.type) {
                    case "youtube":
                        this.youtube(player);
                        break;
                    case "dailymotion":
                        this.dailymotion(player);
                        break;
                    case "html5":
                    default:
                        this.html5();
                }

                $("#"+player.name).parent().remove(); //Remove parent container element (and child self)
                rtv.player.players[player.index] = null; //Remove its data
                //Cannot splice, other indexes are changed.
                //Delete, null, undef index or equivalent (preserves index)
                //If we utilize the players list in a batch we'll need to acknowledge the empty slots

                //Remove chat
                $("#container > #chat").remove()
            },
            youtube: function(player) {
                player.instance.destroy();
            },
            dailymotion: function(player) {
                player.instance.destroy(player.name)
            },
            html5: function() {

            }
        },
        instance: {
            youtube: {
                done: false,
                destroy: function(keepWindow) {
                    this.instance.destroy();
                    !keepWindow && $("#window-"+this.name).remove();
                },
                spawnQueue: [], //See below, might not need this in the long run but trying to be safe
                init: function(target) {
                    if (this.done == true) return;
                    var that = this;
                    //this.done = 1;

                    if (typeof YT == "undefined") {
                        this.loadAPI();
                        //We need to wait for the API to load and throw onYouTubePlayerAPIReady()
                        //In the global namespace we point it back towards this.processQueue();
                        this.spawnQueue.push(function() {
                            that.spawn(target);
                        });
                    } else {
                        this.spawn(target);
                    }
                },
                processQueue: function() {
                    while (this.spawnQueue.length > 0) {
                        var item = this.spawnQueue.splice(0, 1)[0]();
                    }
                },
                loadAPI: function() {
                    var tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/player_api";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                },
                spawn: function(target) {
                    var current = this.getCurrentVideo();
                    var that = this;

                    var instance = new YT.Player(target, {
                        height: '100%',
                        width: '100%',
                        playerVars: {
                            'autoplay': 1,
                            'rel': 0,
                            'start': current.seek_to,
                            'modestbranding': 1,
                            'showinfo': 1
                        },
                        videoId: current.src,
                        events: {
                            'onReady': that.playerOnReady,
                            'onStateChange': (event) => that.playerOnStateChange(target, event)
                        }
                    });

                    this.instance = instance;
                    this.type = "youtube";

                    return instance;
                },
                playerOnReady: function(event) {
                    //var index = /*COPY FROM BELOW*/
                },
                playerOnStateChange: function(target, event) {
                    var index = $("#"+target).parent().data("player-index");

                    if (typeof rtv.player.players[index].resynced === 'undefined' && event.data == YT.PlayerState.PLAYING) {
                        rtv.player.players[index].resynced = true;
                        rtv.player.players[index].resync();
                    }
                    if (event.data == YT.PlayerState.ENDED) {
                        rtv.player.players[index].resync(YT.PlayerState.ENDED);
                    }
                },
                resync: function(reason) {
                    var that = this;
                    var current = that.getCurrentVideo();

                    if (reason == YT.PlayerState.ENDED && this.getCurrentPlayer() !== this.type) {
                        this.resynced = false;
                        this.swapInstance();
                        return 0;
                    }

                    if (that.instance.getVideoData()['video_id'] == current.src) {
                        that.instance.seekTo(current.seek_to, true);
                        that.instance.playVideo();
                    } else {
                        that.instance.loadVideoById({
                            'videoId': current.src,
                            'startSeconds': current.seek_to
                        });
                    }
                },
                pause: function() {
                    this.instance.pauseVideo()
                }
            },
            dailymotion: {
                spawnQueue: [],
                init: function(target) {
                    if (this.done == true) return;
                    var that = this;
                    //this.done = 1;

                    if (typeof DM == "undefined") {
                        this.loadAPI().then(() => {
                            that.spawn(target);
                        })
                    } else {
                        this.spawn(target);
                    }
                },
                loadAPI: function(success) {
                    // https://developer.dailymotion.com/player/#embed-sdk-js-best-practices
                    var tag = document.createElement('script');
                    tag.src = "https://api.dmcdn.net/all.js";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                    return new Promise(success => tag.onload = success)
                },
                destroy: function(keepWindow) {},
                spawn: function(target) {
                    var current = this.getCurrentVideo();
                    var that = this;

                    var instance = new DM.player(target, {
                        height: '100%',
                        width: '100%',
                        video: current.src,
                        params: {
                            'autoplay': true,
                            'start': current.seek_to
                        }
                        /*events: {
                            'onReady': that.playerOnReady,
                            'onStateChange': (event) => that.playerOnStateChange(target, event)
                        }*/
                    });
                    // Carefully crafted events.
                    //instance.addEventListener('apiready', () => this.instance.play())
                    //instance.addEventListener('video_start', () => this.resync())
                    instance.addEventListener('video_end', () => this.resync("ended"))

                    this.instance = instance;
                    this.type = "dailymotion";

                    return instance;
                },
                resync: function(reason) {
                    var that = this;
                    var current = that.getCurrentVideo();

                    if (reason == "ended" && this.getCurrentPlayer() !== this.type) {
                        this.resynced = false;
                        this.swapInstance();
                        return 0;
                    }

                    if (that.instance.video.videoId == current.src) {
                        that.instance.seek(current.seek_to, true);
                        that.instance.play();
                    } else {
                        that.instance.load(current.src); // No seek?
                    }
                },
                pause: function() {
                    this.instance.pause()
                }
            },
            html5: {
                init: function(target) {
                    this.spawn(target);
                },
                destroy: function(keepWindow) {
                    $(this.instance).remove();
                    delete this.instance;
                    !keepWindow && $("#window-"+this.name).remove();
                },
                spawn: function(target) {
                    var current = this.getCurrentVideo();
                    var that = this;

                    var instance = $("<video />", {
                        preload: "none",
                        controls: "",
                        autoplay: ""/*,
                        src: this.cache.info.url_prefix + current.qualities[0].src*/
                    });
                    instance.append($("<source />"), {
                        src: (this.cache.info.url_prefix || "") + current.src,
                        type: "video/mp4"
                    });
                    instance[0].addEventListener('ended', function() {
                        that.resync("ended");
                    }, false);
                    // Scroll volume
                    instance[0].addEventListener('wheel', e =>
                        e.target.volume = e.deltaY < 0 ?
                        Math.min(1,e.target.volume+0.1) :
                        Math.max(0,e.target.volume-0.1)
                    )
                    // Middle-click mute
                    instance[0].addEventListener('auxclick', e => e.target.muted ^= (e.which == 2) )

                    $("#"+target).html(instance);
                    this.instance = instance[0];
                    this.type = "html5";

                    this.resync();
                },
                resync: function(reason) {
                    var current = this.getCurrentVideo();
                    var that = this;

                    if (reason == "ended" && this.getCurrentPlayer() !== this.type) {
                        this.swapInstance();
                        return 0;
                    }

                    var src = (that.cache.info.url_prefix || "") + current.src;

                    if (decodeURI(src) !== decodeURI(that.instance.src)) {
                        that.instance.src = src;
                    }
                    that.instance.currentTime = current.seek_to;
                    that.instance.play();
                },
                pause: function() {
                    this.instance.pause()
                }
            }
        }
    },
    menu: {
        spawn: function() {
            var menu = $("<div id='menu'/>");
            //{id: "openGuide", text: "Open RTV Guide", class: "pointer"}).click(function() { ;

            $("<i />", {class: "fa fa-th-list", title: "Open RTV Guide"}).click(function() { rtv.guide.open(); }).appendTo(menu);
            $("<i />", {class: "fa fa-refresh", title: "Resync Players"}).click(function() {
                //Stolen from guide
                $("[id^=window-player]").each(function() {rtv.player.players[$(this).data()["player-index"]].resync();});
            }).appendTo(menu);
            $("<i />", {class: "fa fa-comments", title: "Toggle chat"}).click(function() {
                $("#chat").toggleClass("closed")
                $("#chat iframe").prop("src", function() { return $(this).data("src") })
            }).appendTo(menu);
            $("<i />", {class: "fa fa-window-restore", title: "Inline popout"}).click(function() {
                $("[id^=window-player]").dialog({
                    close: function() {
                        $("[id^=window-player]")
                        .removeClass("ui-dialog-content ui-widget-content")
                        .css({width:'','min-width':'','max-width':'',height:'','min-height':'','max-height':''})
                        .appendTo("#container");
                        $(this).dialog('destroy');
                    }
                });
            })//.appendTo(menu); //TO-DO: PERFECT.

            this.share().appendTo(menu);

            $("<hr>").appendTo(menu)
            $("<i />", {class: "fa fa-close", title: "Auto-hide sidebar"}).click(function() {
                $("#menu").toggleClass("autohide");
                $(this).toggleClass("fa-check fa-close");
            }).appendTo(menu);
            $("<hr>").appendTo(menu)
            $("<i />", {class: "fa fa-expand", title: "Toggle Fullscreen"}).click(function() {
                if (document.fullscreenElement == null) {
                    $("body")[0].requestFullscreen()
                } else {
                    document.exitFullscreen()
                }
                $(this).toggleClass("fa-expand fa-compress");
            }).appendTo(menu);
            $("<i />", {class: "fa fa-bed", title: "Sleep Timer"}).click(() => this.sleep.dialog()).appendTo(menu);
            $("<div />", {id: 'recents'}).appendTo(menu);

            menu.tooltip({
                position: { my: "left center", at: "right+10% center", collision: "fit"}
            })

            return menu;
        },
        sleep: {
            timer: 0,
            end: "",
            last: 1,
            dialog: function() {
                var that = this;
                var about = `<div title="Sleep Timer" style="text-align:center"></div>`

                $(this.contents()).dialog({
                    id: "sleepDialog",
                    autoOpen: true,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    buttons: {
                        "Apply": function() {
                            that.last = (parseFloat($("input.sleep")[0].value) || 0)
                            var value = that.last * 3600000
                            that.end = moment().add(value).format('hh:mmA')

                            clearTimeout(that.timer)
                            that.timer = 0

                            if (value > 0) {
                                that.timer = setTimeout(() => {
                                    document.exitFullscreen()
                                    rtv.player.players
                                        .filter(player => player !== null)
                                        .forEach(player => {
                                            player.pause()
                                            that.timer = 0
                                        })
                                }, value)
                            }

                            $(this).html(that.contents())
                        },
                    },
                    close: function(e, w) {
                        $(this).dialog('destroy')
                    }
                });

                $(about).find("button").button();
            },
            contents: function() {
                var status = (this.timer == 0) ? "Sleep timer disabled." : `Sleep timer set for ${this.end}`
                var content = `<div title="Sleep Timer" style="text-align:center">
                        Enter a duration in hours to automatically stop playback.<br>Set to 0 to disable.<br><br>
                        <input type="number" class="sleep" name="" min="0" step="0.5" value="${this.last}" style="text-align:center"><br>
                        <br>
                        ${status}
                        </div>`;

                return content
            }
        },
        share: function() {
            return $("<i />", {class: "fa fa-paper-plane", title: "Share this channel"}).click(function() {
                var item = rtv.player.players[$("[id^=window-player]").eq(0).data()["player-index"]].cache;

                if (/^custom\d+$/.test(item.info.url)) {
                    var p = JSON.parse(JSON.stringify(item));
                    delete p.info.chat;
                    delete p.info.url;
                    delete p.info.total_duration;
                    for (i in p.playlist) {
                        delete p.playlist[i].index;
                    }
                    var href = location.href.split("#")[0]+"#?custom";
                    var shurl = $("<a>", {target: "_blank", href: href, text: (href || "Share this URL")});

                    var t = $("<div title='Share "+item.info.name+"' />")
                    .append("<p style='text-align:left'>This custom channel is not hosted on this site and must be manually shared.<br><br>" +
                        "<strong>Step 1:</strong> Share "+shurl[0].outerHTML+" <br><strong>Step 2:</strong> Share the custom channel contents, below:</p>"
                    )
                    .append($("<textarea>", {id: "shareCustom", text: JSON.stringify(p), readonly: "readonly"}).focus(function() { $(this).select(); }));

                    $(t).dialog({
                        autoOpen: true,
                        height: "auto",
                        width: "auto",
                        modal: true,
                        dialogClass: 'dialog-shareChannel',
                        close: function() {
                            $(this).dialog('destroy')
                        },
                        buttons: {
                            /*"test": {
                                text: "Modify Custom Channels",
                                "class": "customPlaylists",
                                click: function() { rtv.guide.channels.custom.open() }
                            }*/
                        }
                    });
                } else {
                    var needle = rtv.player.findNeedle(item);
                    var href = location.href;
                    //href += (href.substr(-1)=='#'?'':'#')+needle;
                    //<a target='_blank' href='"+href+"'>"+href+"</a>
                    var input = $("<input readonly value='"+href+"' />").focus(function() { $(this).select(); });
                    var t = $("<div title='Share "+item.info.name+"' />").append(input);
                    var msg = escape("Let's watch "+item.info.name+" together! "+href);
                    $(t).append("<a target='_blank' href='http://twitter.com/home?status="+msg+"'><i class='fa fa-twitter'></i> Tweet</a>")

                    $(t).dialog({
                        autoOpen: true,
                        height: "auto",
                        width: "auto",
                        modal: true,
                        dialogClass: 'dialog-shareChannel',
                        close: function() {
                            $(this).dialog('destroy')
                        }
                    })
                }
            })
        }
    },
    guide: {
        config: {
            markerWidth: 120, //Width of time markers (9:00pm, 9:30pm, etc.) in pixels
            readLimit: 0 //How far ahead in the schedule to generate. 0 is to the end. Still consider guide width.
        },
        channels: {
            open: function() {
                var that = this;
                var test = "<div id='customizeChannels' title='Select RTV Channels'><form>"+this.generateTable()[0].outerHTML+"</form></div>";

                var channelDialog = $(test).dialog({
                    autoOpen: true,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    dialogClass: 'dialog-customizePlaylists',
                    buttons: {
                        "test": {
                            text: "Custom Channels",
                            "class": "customPlaylists",
                            click: function() { that.custom.open() }
                        },
                        "Save": save,
                        Cancel: function() {
                          channelDialog.dialog("close");
                        }
                    },
                    close: function() {
                        //$("<div title='Select RTV Channels'><p>Please reload RTV to reflect any changes.</p></div>").dialog({modal: true, width: "auto"});
                    }
                })

                function save() {
                    var yours = [];

                    $("select#chanYours option").each(function () {
                        if ($.inArray($(this).val(),yours) == -1) {
                            yours.push($(this).val());
                        }
                    });

                    if (yours.length > 0) {
                        rtv.config.cache.playlists = yours;
                        rtv.config.save();

                        var lastGone = "";
                        if ($.inArray(localStorage.rtvLastPlaylist, yours) == -1) {
                            localStorage.removeItem("rtvLastPlaylist");
                            lastGone = "<hr><p><strong>Note:</strong> Your last viewed channel is not in <strong>Your Channels</strong> and has been reset.<br>Upon reload, a random channel will be selected.</p>";
                        }

                        var msg = "<div title='Select RTV Channels - Saved'><p><strong>Your Channels</strong> has been saved, please reload RTV to reflect any changes.</p>"+lastGone+"</div>"
                        var saveDialog = $(msg).dialog({
                            modal: true,
                            width: "auto",
                            buttons: {
                                "Reload now": function() { location.reload(); },
                                Cancel: function() { saveDialog.dialog("close"); }
                            }
                        });
                    } else {
                        $("<div title='Select RTV Channels - Error'><p><strong>Your Channels</strong> must have at least one channel.</p></div>").dialog({modal: true, width: "auto"});
                    }
                }

                channelDialog.find("button").button().click(function(event) {
                    event.preventDefault();
                    switch ($(this).attr("id")) {
                        case "availMoveAll":
                            $("select#chanAvail option").each(function(i,v) {
                                $("select#chanYours").append($(this).clone()); $(this).remove();
                            });
                            break;
                        case "availMoveSel":
                            $("select#chanAvail option:selected").each(function(i,v) {
                                $("select#chanYours").append($(this).clone()); $(this).remove();
                            });
                            break;
                        case "yoursMoveAll":
                            $("select#chanYours option").each(function(i,v) {
                                $("select#chanAvail").append($(this).clone()); $(this).remove();
                            });
                            break;
                        case "yoursMoveSel":
                            $("select#chanYours option:selected").each(function(i,v) {
                                $("select#chanAvail").append($(this).clone()); $(this).remove();
                            });
                            break;
                    }
                    $("#customizeChannels select option:selected").removeAttr("selected");
                });
            },
            cleanupRegex: /(^playlists\/|(\.(min|json))+$)/ig,
            generateTable: function() {
                //Wake me up.
                var out = $("<div />").append("<p>Channels under <strong>Your Channels</strong> will be displayed in the guide.<br><strong>Custom Channels</strong> are modified by clicking the button below.</p>");

                var table = $("<table />", {id: "customizeChannels", class: "customizeChannels", style: "background-color:white"});
                table.append("<tr class='header'><td>Available Channels</td><td>Your Channels</td></tr>");

                //Generate Your Channels first
                var yourChannels = $("<select />", {id: 'chanYours', 'multiple': true, size: 6});
                for (i=0;i<rtv.config.cache.playlists.length;i++) {
                    var item = rtv.config.cache.playlists[i];
                    $("<option />", {value: item, text: item.replace(this.cleanupRegex,"")}).appendTo(yourChannels);
                }
                //Generate Available Channels
                var availChannels = this.availChannels();
                table.append("<tr><td>"+availChannels[0].outerHTML+"</td><td>"+yourChannels[0].outerHTML+"</td></tr>");
                //Generate buttons
                table.append("<tr><td style='text-align:right'><button id='availMoveAll'>All &gt;</button><button id='availMoveSel'>Selected &gt;</button></td><td style='text-align:left'><button id='yoursMoveSel'>&lt; Selected</button><button id='yoursMoveAll'>&lt; All</button></td></tr>");
                table.append("</table>");

                //Generate output
                out.append(table);

                return out;
            },
            availChannels: function(needle) {
                var avail = $("<select />", {id: 'chanAvail', 'multiple': true, size: 6});

                for (i=0;i<rtv.config.defaultPlaylists.length;i++) {
                    var item = rtv.config.defaultPlaylists[i];
                    if ($.inArray(item, rtv.config.cache.playlists) == -1) {
                        $("<option />", {value: item, text: item.replace(this.cleanupRegex,"")}).appendTo(avail);
                    }
                }

                return avail;
            },
            custom: {
                open: function(share) {
                    var that = this;
                    var body = (!share) ? "Enter each custom channel in its own text box." : "Did someone share a custom channel with you?<br>Please paste it below and click \"Save\" to use it.";
                    var manager = "<div title='Custom Channels'><p>"+body+"</p>"+this.load()+"</div>"

                    var managerDialog = $(manager).dialog({
                        autoOpen: true,
                        height: "auto",
                        width: "auto",
                        modal: true,
                        buttons: {
                            "Help": function() { window.open('https://github.com/myrtv/myrtv.github.io/wiki/Custom-Channels', '_blank'); },
                            "upload": {
                                text: "Open",
                                click: function() { that.upload() }
                            },
                            "Save": function() { that.save(share) },
                            Cancel: function() { managerDialog.dialog("close"); }
                        }
                    }).attr("id", "customPlaylistsManager");
                },
                save: function(share) {
                    console.log(share);
                    //All non-empty inputs pushed to array, then JSON.stringify to save.
                    var t = [],
                        that = this;

                    $("#customPlaylistsManager input").each(function(i,v) {
                        if (v.value !== "" && that.test(v.value)) {
                            t.push(JSON.parse(v.value));
                        }
                    });

                    localStorage.rtvCustomPlaylists = JSON.stringify(t);

                    if (t.length > 0) {
                        rtv.config.customs();
                        //$(".ui-dialog-content").dialog("close");
                        if (t.length == 1) {
                            rtv.player.destroy.player($("#container > [id^=window-player-]").data("player-index"));
                            rtv.player.spawn("custom0");
                        }

                        if (!share) {
                            rtv.guide.open();
                        } else {
                            $("#customPlaylistsManager").dialog("close");
                        }
                    } else {
                        var dlg = $("<div title='Custom Channels - Saved'><p><strong>Custom Channels</strong> has been saved, please reload RTV to reflect any changes.</p></div>").dialog({
                            modal: true,
                            width: "auto",
                            buttons: {
                                "Reload now": function() { location.reload(); },
                                Cancel: function() { dlg.dialog("close"); }
                            }
                        });
                    }
                },
                test: function(list) {
                    try {
                        var a = JSON.parse(list)
                        if (a.info && a.info.name && a.playlist.length > 0) {
                            return true
                        } else {
                            rtv.guide.channels.custom.edialog(i,"No info.name or empty playlist.","Ensure it was entered correctly.");
                            return false
                        }
                    } catch(e) {
                        rtv.guide.channels.custom.edialog(i,e,"Ensure it was entered correctly.");
                        return false
                    }
                },
                edialog: function(i,error,follow) {
                    $('<div title="Issue parsing input #'+(i+1)+'"><p class="depress">'+error+'</p>'+follow+'</div>').dialog({width:"auto",modal:1})
                },
                genInput: function(line) {
                    return $('<input />', {
                            placeholder: "Paste playlist here...",
                            style: "width:100%",
                            value: line
                        })[0].outerHTML;
                },
                load: function() {
                    var that = this
                    var out = that.genInput("");

                    if (localStorage.rtvCustomPlaylists) {
                        $.each(JSON.parse(localStorage.rtvCustomPlaylists), function(i,v) {
                            out = that.genInput(JSON.stringify(v))+out;
                        })
                    }

                    return out;
                },
                upload: function() {
                    var that = this
                    var fileInput = $("<input>", {type: "file", accept: ".txt,.json"})
                                    .change(function(ev) {
                                        var read = new FileReader();
                                        read.onload = function(){
                                            $("#customPlaylistsManager").append(that.genInput(read.result))
                                        }
                                        read.readAsText(ev.currentTarget.files[0]);
                                    }).click()
                    return fileInput
                }
            }
        },
        open: function() {
            this.close();
            $("body").append(rtv.guide.generate());
        },
        close: function() {
            $("#rtvGuide").remove();
        },
        generate: function() {
            var that = this;
            var guide = $("<div />", {id: "rtvGuide"});       //The final result to spit out.
            var container = $("<div />", {id: "rtvGuideSub"});//The final result to spit out.
            var channels = $("<div />", {id: "rtvChannels"}); //The channels column. Each row is a channel.
            var shows = $("<div />", {id: "rtvShows"});       //The shows column. Each row is a channel's shows.

            guide.append(this.generateHead());

            var width = 0;
            var halfhour = moment();

            $.each(Object.keys(rtv.player.cached_playlists).sort(), function (index, list) {
                var source = $.extend({}, {cache: rtv.player.cached_playlists[list]}, rtv.player.playlist.utilities);
                var active = (rtv.player.players.length > 0 && rtv.player.players.slice(-1)[0].cache.info.url == source.cache.info.url)

                var channel = that.generateChannel(source);
                var row = that.generateRow(source);

                if (active) { //Show active channel first in list. Alternative: Flexbox order sort to top with CSS.
                    channels.prepend(channel);
                    shows.prepend(row.row);
                } else {
                    channels.append(channel);
                    shows.append(row.row);
                }

                if (row.width > width) { width = row.width; }
                halfhour = row.halfhour;
            });

            channels.prepend($("<div />", {class: "channel marker"}));
            shows.append(this.generateLiner(halfhour));
            shows.prepend(this.generateMarkers(width, halfhour));

            container.append(channels);
            container.append(shows);
            guide.append(container);

            $(guide).on("click", ".show", function() {
                $("<div />", {html: this.title.replace(/\n/g,'<br>')}).dialog({
                    autoOpen: true,
                    height: "auto",
                    width: "auto",
                    modal: true,
                    close: function() {}
                });
            });

            return guide;
        },
        generateHead: function() {
            var head = $("<div />", {class: "guideHead"});
            $.each([
                ["Close RTV Guide", function() { rtv.guide.close(); }],
                ["Resync Player", function() {$("[id^=window-player]").each(function() {rtv.player.players[$(this).data()["player-index"]].resync();});}],
                ["Select Channels", function() { rtv.guide.channels.open(); }],
                ["About RTV", function() { rtv.about(); }]
            ], function(i,v) {
                $("<span />", {class: "pointer", text: v[0]}).on('click', v[1]).appendTo(head);
            });

            if (0 && Notification.permission !== "granted") {
                $("<span />", {id: "enableSubs", class: "pointer", text: "(Enable Subscriptions)"}).one('click',function() {
                    //rtv.notifications.init();
                    $("#enableSubs").remove ();
                }).appendTo(head);
            }

            return head;
        },
        generateChannel: function (source) {
            //console.log(arguments.callee.caller);
            var currentStream = ((rtv.player.players.length > 0 && rtv.player.players.slice(-1)[0].cache.info.url == source.cache.info.url) ? " currentStream" : "");
            var channel = $("<div />", {
                class: "channel pointer"+currentStream,
                text: source.cache.info.name,
                title: (source.cache.info.note)
            });

            channel.click(function(e) {
                rtv.player.destroy.player($("#container > [id^=window-player-]").data("player-index"));
                rtv.player.spawn(source.cache.info.url);
                rtv.guide.close();
            });

            return channel;
        },
        generateMarkers: function(width, halfhour) {
            //Generate time markers.
            //width = width of previously generated row to generate markers for
            //halfhour = moment() set to latest half-hour
            var temp = $("<div />", {class: "row marker"});

            for (limit = 0; limit < Math.ceil(width / this.config.markerWidth)+1; limit++) {
                $("<div />", {
                    class: "show",
                    text: halfhour.format("LT") + (((halfhour.hour() == 0 /*|| halfhour.hour() == 12*/) && halfhour.minute() < 30) ? " ("+halfhour.format("l")+")" : "")
                })
                .css({"width": this.config.markerWidth, "maxWidth": this.config.markerWidth})
                .appendTo(temp);

                halfhour.add(30, 'minutes');
            }

            return temp;
        },
        generateLiner: function(halfhour) {
            var offset = this.itemWidth(Math.floor(new Date() - halfhour.toDate()) / 1000);
            return $("<div />", {class: "sparksLinerHigh"}).css({left: offset+"px"});
        },
        generateRow: function(source) {
            var that = this;
            var row = $("<div />", {class: "row"});
            var current = source.getCurrentVideo();
            var endingTime = moment().add(current.duration - current.seek_to, 'seconds');
            //Determine nearest half hour
            var halfhour = moment().seconds(0); halfhour.minutes((halfhour.minutes() >= 30) ? 30 : 0); //Clamp to latest half-hour.
            var distanceNow = Math.round((new Date() - halfhour.toDate()) / 1000); //Distance, in seconds, from now to latest half-hour.
            var startingTime = moment().subtract(current.seek_to, 'seconds'); //Starting time of item.
            var gap = (startingTime.toDate() < halfhour.toDate()) ? 0 : Math.round((startingTime.toDate() - halfhour.toDate())/1000);
            var distanceEnd = Math.round((endingTime.toDate() - halfhour.toDate()) / 1000); //Distance, in seconds, from latest half-hour to end of item.
            var adjustedDuration = (startingTime.toDate() < halfhour.toDate()) ? distanceEnd : current.duration;

            var cacheWidth = 0;
            $("<div />", {class: "show gap"}).width(this.itemWidth(gap)).appendTo(row); //Add the starting gap element, we can style it if we want.
            //Instead of arbitrarily stopping at 10 we could also stop around a pre-calculated width.
            var toIndex = ((this.config.readLimit) ? current.index + 1 + this.config.readLimit : source.cache.playlist.length);
            $.each(source.cache.playlist.slice(current.index, toIndex), function (index, item) {
                var duration = (index > 0) ? item.duration : adjustedDuration;
                var width = that.itemWidth(duration);
                cacheWidth += width;
                var endClass = (item.index+1 == source.cache.playlist.length) ? " playlistEnd" : "";
                var startClass = (index == 0 && item.duration !== adjustedDuration) ? " abruptStart" : "";

                $("<div />", {
                    class: "show"+endClass+startClass,
                    text: item.name,
                    title: item.name+
                    "\nDuration: "+moment.utc(item.duration * 1000).format("H:mm:ss")+
                    "\n"+((moment().toDate() > startingTime.toDate())?"Started ":"Starts ")+moment().to(startingTime)+
                    "\nStart: "+startingTime.format("LLLL")+
                    "\nStop: "+startingTime.add(item.duration, 'seconds').format("LLLL")
                })
                .css({"width": width, "maxWidth": width})
                .appendTo(row);
            });

            return {"row": row, "width": cacheWidth, "halfhour": halfhour};
        },
        itemWidth: function (duration) {
            //duration = either time since lead-in to clamp (determined elsewhere) or total duration of an item
            var halfhourWidth = this.config.markerWidth; //Size, in pixels, of each half-hour segment segment.
            var clampUnit = 1800; //Half-hour in seconds.
            var result = (Math.floor(duration / clampUnit) * halfhourWidth) + Math.round(((duration % clampUnit) / clampUnit) * halfhourWidth);

            return result;
        }
    },
    notifications: {
        //Eventually something with service workers?
        init: function() {
            if ('Notification' in window) {
                Notification.requestPermission();
            }
            this.subscriptions.load();
            //this.subscriptions.subNextInLastPlaylist();
        },
        subscriptions: {
            cache: [],
            subNextInLastPlaylist: function() {
                //confirm("Schedule a reminder for this item? (starting, missed, etc.)\n\nRequires authorization and RTV to be open.")
                var source = rtv.player.players.slice(-1)[0];
                var current = source.getCurrentVideo();
                var next = source.cache.playlist[current.index + 1];

                this.add({
                    title: next.name,
                    startTime: moment().subtract(current.seek_to, 'seconds').add(current.duration, 'seconds'),
                    duration: next.duration,
                    channel: source.cache.info.name,
                    url: source.cache.info.url
                });
            },
            load: function() {
                if (localStorage['rtvSubCache']) {
                    this.cache = JSON.parse(localStorage['rtvSubCache']);
                }
                rtv.notifications.processSubscriptions();
            },
            save: function() {
                //localStorage['rtvSubCache'] = JSON.stringify(this.cache);
                rtv.notifications.processSubscriptions();
            },
            add: function(input) {
                //input{title: "", startTime: MomentJS{}, duration: 0}
                this.cache.push(input);
                this.save();
            },
            remove: function(input) {
                this.save()
            }
        },
        processSubscriptions: function() {
            var that = this;

            $.each(this.subscriptions.cache, function (index, subscription) {
                that.push({
                    title: subscription.channel,
                    body: subscription.title+" begins "+subscription.startTime.fromNow()+"\nClick here to tune in.",
                    url: subscription.url
                });
            })
        },
        push: function(pushed) {
            var title = (pushed.title || "Default title");
            var notif = new Notification(
                title,
                {
                    body: pushed.body,
                    /*icon: "favicon96.png"*/
                    data: pushed.url
                }
            );
            notif.onclick = function (event) {
                //alert('chune');
                rtv.player.players.slice(-1)[0].destroy();
                rtv.player.spawn(event.target.data);
                rtv.guide.close();
            }
        }
    }
}

function onYouTubePlayerAPIReady() { rtv.player.instance.youtube.processQueue(); }

$(document).ready(function() {
    rtv.preinit(); //Do this proper
});
