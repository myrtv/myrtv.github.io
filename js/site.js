var rtv = {
    offset: 0, //Global sync offset. Tempted to make per-player offsets.
    preinit: function() {
        var that = this;

        $(document).on('change', '.remote', function() {
            var next = this.value;
            rtv.player.players[$(this).parent().parent().data("player-index")].destroy();
            rtv.player.create(next);
        })

        $("body").append($("<div />", {id: 'container'}));
        this.init();
    },
    init: function(path) {
        var that = this;

        this.player.create();
    },
    player: {
        all: {
            destroy: function() { rtv.player.destroy.all() },
            sync: function() {
                var that = this;

                $.each(rtv.player.players, function (i, player) {
                    switch (player.type) {
                        case "youtube":
                            rtv.player.instance.youtube.syncPlayer(player);
                            break;
                        case "html5":
                        default:
                            rtv.player.instance.html5.syncPlayer(player);
                    }
                });
            }
        },
        players: [], //{name: "player-0", type: "html5", instance{}, cache[]}
        create: function(path) {
            var list = (path || localStorage['rtv-last'] || 'playlists/initiald.min.json');
            var that = this;

            this.playlist.generate(list, this.spawn);
        },
        playlist: {
            generate: function(list, callback) {
                $.getJSON(list, function (data) {
                    localStorage['rtv-last'] = list; //Save.

                    //Offline testing and not using a virtual server is weird, don't judge me.
                    var playlist = (data.playlist) ? data : JSON.parse(data.responseText);

                    //Determine total length
                    playlist.info.total_duration = 0;
                    $.each(playlist.playlist, function (index, key) {
                        playlist.info.total_duration += key.duration;
                        playlist.playlist[index].index = index;
                    });

                    callback(playlist);
                });
            },
            utilities: {
                genGuide: function() {
                    $("#rtvGuide").remove();
                    $("body").append(rtv.guide.generate());
                },
                getCurrentTime: function() {
                    var start_epoch = new Date(this.cache.info.start_epoch_gtm * 1000);
                    var start = (Math.round(new Date() / 1000) + rtv.offset) - Math.round(start_epoch / 1000);
                    var total_duration = this.cache.info.total_duration;
                    var loops = Math.ceil(start / total_duration);

                    start %= total_duration; //Muh modulo

                    console.log("Loop "+loops+" ("+total_duration+"secs/loop), beginning "+start_epoch.toString()+".\n"+
                                "Our current progress through it is "+Math.round(start/total_duration * 100)+"%.");

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
        spawn: function(playlist) {
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
            $("<div />", {id: "window-"+name}).data({"player-index": i}).append(rtv.menu.spawn()).append($("<div />", {id: name})).appendTo("#container");

            switch (playlist.info.service) {
                case "youtube":
                    $.extend(player, that.playlist.utilities, that.instance.youtube);
                    break;
                default:
                    $.extend(player, that.playlist.utilities, that.instance.html5);
            }

            player.init(name);
            rtv.player.players.push(player);
            player.genGuide();

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
                    $("#head").append(this.generatePlaylistFromIndex(current.index));
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
                    $("#head").append(this.generatePlaylistFromIndex(current.index));
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
            //Eventually pipe in a "directory list" then defer population.
            var streams = [
                {name: "InitialD 1/2/4", path: "playlists/initiald.min.json"},
                {name: "AGDQ2011", path: "playlists/gdq/agdq2011.min.json"},
                {name: "AGDQ2012", path: "playlists/gdq/agdq2012.min.json"},
                {name: "SGDQ2012", path: "playlists/gdq/sgdq2012.min.json"},
                {name: "AGDQ2013", path: "playlists/gdq/agdq2013.min.json"},
                {name: "SGDQ2013", path: "playlists/gdq/sgdq2013.min.json"},
                {name: "AGDQ2014", path: "playlists/gdq/agdq2014.min.json"},
                {name: "SGDQ2014", path: "playlists/gdq/sgdq2014.min.json"},
                {name: "AGDQ2015", path: "playlists/gdq/agdq2015.min.json"},
                {name: "SGDQ2015", path: "playlists/gdq/sgdq2015.min.json"},
                {name: "AGDQ2016", path: "playlists/gdq/agdq2016.min.json"},
                {name: "SGDQ2016", path: "playlists/gdq/sgdq2016.min.json"},
                {name: "AGDQ2017 (Raw)", path: "playlists/gdq/agdq2017raw.min.json"},
                {name: "AllGDQ", path: "playlists/gdq/allgdq.min.json"},
                {name: "RPGLB2015", path: "playlists/rpglb/2015.json"},
                {name: "RPGLB2016", path: "playlists/rpglb/2016.json"},
                {name: "RPGLB2016TalesOf", path: "playlists/rpglb/2016talesof.json"},
                {name: "ESA2015 Purple", path: "playlists/esa/2015purple.min.json"}
            ];

            var select = $("<select />", {class: "remote"});
            $.each(streams, function (i, stream) {
                var option  = $("<option />", {
                    value: stream.path,
                    text: stream.name,
                });
                if (stream.path == localStorage['rtv-last']) {
                    option.attr({"selected":""});
                }

                option.appendTo(select);
            });

            return $("<div />", {id: "head"}).append(select);

            //setTimeout(function() { $("#head").slideUp(); }, 5000);
        }
    },
    guide: {
        generate: function() {
            var guide = $("<div />", {id: "rtvGuide"});       //The final result to spit out.
            var channels = $("<div />", {id: "rtvChannels"}); //The channels column. Each row is a channel.
            var shows = $("<div />", {id: "rtvShows"});       //The shows column. Each row is a channel's shows.
            var source = rtv.player.players.slice(-1)[0];     //For now, use latest player to populate a single row.

            channels.append(this.generateChannel(source));
            shows.append(this.generateRow(source));

            guide.append(channels);
            guide.append(shows);

            return guide;
        },
        generateChannel: function (source) {
            return $("<div />", {
                class: "channel",
                text: source.cache.info.name
            });
        },
        generateRow: function(source) {
            var that = this;
            var row = $("<div />", {class: "row"});
            var current = source.getCurrentVideo();
            var endingTime = moment().add(current.duration - current.seek_to, 'seconds');
            //Determine nearest half hour
            var halfhour = moment().seconds(0); halfhour.minutes((halfhour.minutes() >= 30) ? 30 : 0); //Clamp to latest half-hour.
            var distanceNow = Math.floor((new Date() - halfhour.toDate()) / 1000); //Distance, in seconds, from now to latest half-hour.
            var startingTime = moment().subtract(current.seek_to, 'seconds'); //Starting time of item.
            var gap = (startingTime.toDate() < halfhour.toDate()) ? 0 : Math.floor((startingTime.toDate() - halfhour.toDate())/1000);
            var distanceEnd = Math.floor((endingTime.toDate() - halfhour.toDate()) / 1000); //Distance, in seconds, from latest half-hour to end of item.
            var adjustedDuration = Math.floor((endingTime.toDate() - moment()) / 1000);

            console.log(gap);
            //Instead of arbitrarily stopping at 10 we could also stop around a pre-determined width.
            $("<div />", {class: "show gap"}).width(this.itemWidth(gap)).appendTo(row);
            $.each(source.cache.playlist.slice(current.index, current.index+10), function (index, item) {
                var width = that.itemWidth((index > 0) ? item.duration : item.duration);

                $("<div />", {
                    class: "show",
                    text: item.name
                })
                .width(width)
                .appendTo(row);
            });

            return row;
        },
        itemWidth: function (duration) {
            //duration = either time since lead-in to clamp (determined elsewhere) or total duration of an item
            var halfhourWidth = 300; //Size, in pixels, of each half-hour segment segment.
            var clampUnit = 1800; //Half-hour in seconds.

            return (Math.floor(duration / clampUnit) * halfhourWidth) + Math.floor(halfhourWidth * (duration / clampUnit));
        }
    }
}

function onYouTubePlayerAPIReady() { rtv.player.instance.youtube.processQueue(); }

$(document).ready(function() {
    rtv.preinit(); //Do this proper
});