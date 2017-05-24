var rtv = {
    offset: 0, //Global sync offset. Tempted to make per-player offsets.
    preinit: function() {
        var that = this;

        $("body").append($("<div />", {id: 'container'}).append(this.menu.spawn()));
        this.config.init();
        this.init();
    },
    config: {
        init: function() {
            //this.load(); //Deal with this later. Populating "new" playlists is tedious when cached.
            if (!this.cache.playlists) { this.cache.playlists = this.defaultPlaylists; }
            //this.save();
        },
        cache: {},
        load: function() {
            if (localStorage['rtvConfig']) {
                this.cache = JSON.parse(localStorage['rtvConfig']);
            }
        },
        save: function() {
            localStorage['rtvConfig'] = JSON.stringify(this.cache);
        },
        defaultPlaylists: [
            "playlists/initiald.min.json",
            "playlists/ethoslab.min.json",
            "playlists/ethoplaysminecraft.min.json",
            "playlists/gdq/agdq2011.min.json",
            "playlists/gdq/agdq2012.min.json",
            "playlists/gdq/sgdq2012.min.json",
            "playlists/gdq/agdq2013.min.json",
            "playlists/gdq/sgdq2013.min.json",
            "playlists/gdq/agdq2014.min.json",
            "playlists/gdq/sgdq2014.min.json",
            "playlists/gdq/agdq2015.min.json",
            "playlists/gdq/sgdq2015.min.json",
            "playlists/gdq/agdq2016.min.json",
            "playlists/gdq/sgdq2016.min.json",
            "playlists/gdq/agdq2017raw.min.json",
            "playlists/gdq/allgdq.min.json",
            "playlists/rpglb/2015.json",
            "playlists/rpglb/2016.json",
            "playlists/rpglb/2017.json",
            "playlists/rpglb/2016talesof.json",
            "playlists/rpglb/2017talesof.json",
            "playlists/esa/2015purple.min.json"
        ]
    },
    init: function(path) {
        this.player.create();
    },
    player: {
        players: [], //{name: "player-0", type: "html5", instance{}, cache[]}
        create: function(path) {
            var list = (path || localStorage['rtvLastPlaylist'] || 'playlists/gdq/allgdq.min.json');
            var that = this;

            $.each(rtv.config.cache.playlists, function (index, item) {
                var cb = (item == list) ? function() { localStorage['rtvLastPlaylist'] = list; that.spawn(item) } : false;
                that.playlist.generate(item, cb);
            });
        },
        cached_playlists: {},
        playlist: {
            generate: function(list, callback) {
                var store = list;

                if (rtv.player.cached_playlists[store] && callback) {
                    callback();
                }

                $.getJSON(list, function (data) {
                    //localStorage['rtvLastPlaylist'] = list; //Save.

                    //Offline testing and not using a virtual server is weird, don't judge me.
                    var playlist = (data.playlist) ? data : JSON.parse(data.responseText);

                    //Determine total length
                    playlist.info.url = store;
                    playlist.info.total_duration = 0;
                    $.each(playlist.playlist, function (index, key) {
                        playlist.info.total_duration += key.duration;
                        playlist.playlist[index].index = index;
                    });

                    rtv.player.cached_playlists[store] = playlist;

                    if (callback) {
                        callback();
                    }
                });
            },
            utilities: {
                getCurrentTime: function() {
                    var start_epoch = new Date(this.cache.info.start_epoch_gtm * 1000);
                    var start = (Math.round(new Date() / 1000) + rtv.offset) - Math.round(start_epoch / 1000);
                    var total_duration = this.cache.info.total_duration;
                    var loops = Math.ceil(start / total_duration);

                    start %= total_duration; //Muh modulo

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
                            the_key.seek_to = current_time - current_total;
                            return false;
                        } else {
                            current_total += key.duration;
                        }
                    });

                    return the_key;
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
                }
            }
        },
        spawn: function(path) {
            if (!path && !this.cached_playlists[path]) { return false ; }

            localStorage['rtvLastPlaylist'] = path;
            var playlist = this.cached_playlists[path];
            var that = rtv.player;
            var i = that.players.length;
            var name = "player-"+i;

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

            switch (playlist.info.service) {
                case "youtube":
                    $.extend(player, that.playlist.utilities, that.instance.youtube);
                    break;
                default:
                    $.extend(player, that.playlist.utilities, that.instance.html5);
            }

            player.init(name);
            rtv.player.players.push(player);

            return i;
        },
        destroy: {
            all: function() {
                var that = this;

                $.each(rtv.player.players, function (i, player) {
                    that.player(player);
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
                    case "html5":
                    default:
                        this.html5();
                }

                $("#"+player.name).parent().remove(); //Remove parent container element (and child self)
                rtv.player.players[player.index] = null; //Remove its data
                //Cannot splice, other indexes are changed.
                //Delete, null, undef index or equivalent (preserves index)
                //If we utilize the players list in a batch we'll need to acknowledge the empty slots
            },
            youtube: function(player) {
                player.instance.destroy();
            },
            html5: function() {

            }
        },
        instance: {
            youtube: {
                done: false,
                destroy: function() {
                    this.instance.destroy();
                    $("#window-"+this.name).remove();
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
                        videoId: current.qualities[0].src,
                        events: {
                            'onReady': that.playerOnReady,
                            'onStateChange': that.playerOnStateChange
                        }
                    });

                    this.instance = instance;
                    this.type = "youtube";

                    return instance;
                },
                playerOnReady: function(event) {},
                playerOnStateChange: function(event) {
                    var index = $(event.target.a).parent().data("player-index");

                    if (event.data == YT.PlayerState.ENDED) {
                        rtv.player.players[index].resync();
                    }
                },
                resync: function() {
                    var that = this;
                    var current = that.getCurrentVideo();

                    if (that.instance.getVideoData()['video_id'] == current.qualities[0].src) {
                        that.instance.seekTo(current.seek_to, true);
                        that.instance.playVideo();
                    } else {
                        that.instance.loadVideoById({
                            'videoId': current.qualities[0].src,
                            'startSeconds': current.seek_to
                        });
                    }
                }
            },
            html5: {
                init: function(target) {
                    this.spawn(target);
                },
                destroy: function() {
                    $(this.instance).remove();
                    delete this.instance;
                    $("#window-"+this.name).remove();
                },
                spawn: function(target) {
                    var current = this.getCurrentVideo();
                    var that = this;

                    var instance = $("<video />", {
                        preload: "none",
                        controls: "",
                        autoplay: "",
                        src: this.cache.info.url_prefix + current.qualities[0].src
                    });
                    instance[0].addEventListener('ended', function() {
                        that.resync();
                    }, false);

                    $("#"+target).html(instance);
                    this.instance = instance[0];
                    this.type = "html5";

                    this.resync();
                },
                resync: function() {
                    var current = this.getCurrentVideo();
                    var that = this;

                    var src = that.cache.info.url_prefix + current.qualities[0].src;

                    if (src !== that.instance.src) {
                        that.instance.src = src;
                    }
                    that.instance.currentTime = current.seek_to;
                    that.instance.play();
                }
            }
        }
    },
    menu: {
        spawn: function() {
            var head = $("<div />", {id: "head"});
            head.append($("<span />", {text: "Open RTV Guide", class: "pointer"}).click(function() { rtv.guide.open(); }));

            return head;
        }
    },
    guide: {
        config: {
            markerWidth: 120, //Width of time markers (9:00pm, 9:30pm, etc.) in pixels
            readLimit: 0 //How far ahead in the schedule to generate. 0 is to the end. Still consider guide width.
        },
        open: function() {
            $("#rtvGuide").remove();
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
            var halfhour;

            $.each(rtv.player.cached_playlists, function (index, list) {
                var source = $.extend({}, {cache: list}, rtv.player.playlist.utilities);

                channels.append(that.generateChannel(source));
                var row = that.generateRow(source);
                shows.append(row.row);

                if (row.width > width) { width = row.width; }
                halfhour = row.halfhour;
            });

            channels.prepend($("<div />", {class: "channel marker"}));
            shows.append(this.generateLiner(halfhour));
            shows.prepend(this.generateMarkers(width, halfhour));

            container.append(channels);
            container.append(shows);
            guide.append(container);

            return guide;
        },
        generateHead: function() {
            var head = $("<div />", {class: "guideHead"});
            $("<span />", {class: "pointer", text: "(X) Close RTV Guide"}).one('click',function() { rtv.guide.close(); }).appendTo(head);

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
            var currentStream = ((rtv.player.players.slice(-1)[0].cache.info.url == source.cache.info.url) ? " currentStream" : "");
            var channel = $("<div />", {
                class: "channel pointer"+currentStream,
                text: source.cache.info.name
            });

            channel.click(function(e) {
                rtv.player.players.slice(-1)[0].destroy();
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
                    //"\nDuration: "+(duration / 60)+"m"+
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
                console.log();
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