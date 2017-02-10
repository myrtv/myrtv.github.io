var rtv = {
    preinit: function() {
        var that = this;

        $(document).on('change', '#remote', function() {
            that.player.destroy.all();
            that.player.create(this.value);
        })

        $("body").append($("<div />", {id: 'container'}));
        this.menu.spawn();
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

            //Fetch playlist
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

                return that.spawn(playlist);
            });
        },
        spawn: function(playlist) {
            var i = this.players.length;
            var name = "player-"+i;

            //Initialize the new player
            var player = {
                "index": i,
                "name": name,
                "cache": playlist,
                "instance": {}
            }

            this.players.push(player);

            //Create parent container (especially for YouTube, but we'll need it later anyway even for HTML5)
            $("<div />", {id: "window-"+name}).append($("<div />", {id: name})).appendTo("#container");

            switch (playlist.info.service) {
                case "youtube":
                    this.instance.youtube.init(player,  name);
                    break;
                default:
                    this.instance.html5.spawn(player, name);
            }

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
                spawnQueue: [], //See below, might not need this in the long run but trying to be safe
                init: function(player, target) {
                    if (this.done == true) return;
                    //this.done = 1;

                    if (typeof YT == "undefined") {
                        this.loadAPI();
                        //We need to wait for the API to load and throw onYouTubePlayerAPIReady()
                        //In the global namespace we point it back towards this.processQueue();
                        this.spawnQueue.push({"player": player, "target": target});
                    } else {
                        this.spawn(player, target);
                    }
                },
                processQueue: function() {
                    while (this.spawnQueue.length > 0) {
                        var item = this.spawnQueue.splice(0, 1)[0];
                        this.spawn(item.player, item.target);
                    }
                },
                loadAPI: function() {
                    var tag = document.createElement('script');
                    tag.src = "https://www.youtube.com/player_api";
                    var firstScriptTag = document.getElementsByTagName('script')[0];
                    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                },
                spawn: function(player, target) {
                    var current = rtv.player.getCurrentVideo(player);
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

                    rtv.player.players[player.index].instance = instance;
                    rtv.player.players[player.index].type = "youtube";

                    return instance;
                },
                playerOnReady: function(event) {},
                playerOnStateChange: function(event) {
                    var target = event.target.a.id.split("-").pop();
                    var player = rtv.player.players[target];

                    //console.log("player #"+target+" (youtube) state change", event, player);

                    if (event.data == YT.PlayerState.ENDED) {
                        rtv.player.instance.youtube.syncPlayer(player);
                    }
                },
                syncPlayer: function(player) {
                    console.log('sync?',player);
                    var current = rtv.player.getCurrentVideo(player);

                    setTimeout(function() {
                        if (player.instance.getVideoData()['video_id'] == current.qualities[0].src) {
                            player.instance.seekTo(current.seek_to, true);
                            player.instance.playVideo();
                        } else {
                            player.instance.loadVideoById({
                                'videoId': current.qualities[0].src,
                                'startSeconds': current.seek_to
                            });
                        }
                    }, 200);
                }
            },
            html5: {
                spawn: function(player, target) {
                    var current = rtv.player.getCurrentVideo(player);
                    var that = this;

                    var instance = $("<video />", {
                        preload: "none",
                        controls: "",
                        autoplay: "",
                        src: player.cache.info.url_prefix + current.qualities[0].src
                    });
                    instance[0].addEventListener('ended', function() {
                        that.syncPlayer(rtv.player.players[player.index]);
                    }, false);

                    $("#"+target).html(instance);
                    rtv.player.players[player.index].instance = instance[0];
                    rtv.player.players[player.index].type = "html5";

                    this.syncPlayer(rtv.player.players[player.index]);
                },
                syncPlayer: function(player) {
                    var current = rtv.player.getCurrentVideo(player);

                    setTimeout(function() {
                        var src = player.cache.info.url_prefix + current.qualities[0].src;

                        if (src !== player.instance.src) {
                            player.instance.src = src;
                        }
                        player.instance.currentTime = current.seek_to;
                        player.instance.play();
                    }, 200);
                }
            }
        },
        getCurrentTime: function(player) {
            var start_epoch = new Date(player.cache.info.start_epoch_gtm * 1000);
            var start = Math.round(new Date() / 1000) - Math.round(start_epoch / 1000);
            var total_duration = player.cache.info.total_duration;
            var loops = 1;

            while (start >= total_duration) {
                start -= total_duration;
                loops++;
            }

            console.log("Loop "+loops+" ("+total_duration+"secs/loop), beginning "+start_epoch.toString()+".\n"+
                        "Our current progress through it is "+Math.round(start/total_duration * 100)+"%.");

            return start;
        },
        getCurrentVideo: function(player) {
            var current_total = 0;
            var current_time = this.getCurrentTime(player);
            var the_key = {};

            $.each(player.cache.playlist, function (index, key) {
                if (current_time < current_total + key.duration) {
                    the_key = key;
                    the_key.seek_to = current_time - current_total;
                    return false;
                } else {
                    current_total += key.duration;
                }
            });

            return the_key;
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

            var select = $("<select />", {id: "remote"});
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

            var head = $("<div />", {id: "head"}).append(select);

            $("body").prepend(head);

            //setTimeout(function() { $("#head").slideUp(); }, 5000);
        }
    }
}

function onYouTubePlayerAPIReady() { rtv.player.instance.youtube.processQueue(); }

$(document).ready(function() {
    rtv.preinit(); //Do this proper
});