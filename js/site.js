var rtv = {
    json_cache: {},
    player: {type: "", instance: {}},
    preinit: function() {
        var that = this;

        $('#remote').on('change', function() {
            that.init(this.value);
        })


        this.init();
    },
    init: function(path) {
        var that = this;

        $.getJSON((path || 'playlists/initiald.min.json'), function (data) {
            //Offline testing and not using a virtual server is weird, don't judge me.
            that.json_cache = (data.playlist) ? data : JSON.parse(data.responseText);

            //Determine total length
            that.json_cache.info.total_duration = 0;
            $.each(that.json_cache.playlist, function (index, key) {
                that.json_cache.info.total_duration += key.duration;
            })

            that.spawn.main();
        });
    },
    getCurrentTime: function() {
        //It's close, but not enough.
        var start_epoch = new Date(this.json_cache.info.start_epoch_gtm * 1000);
        var start = Math.round(new Date() / 1000) - Math.round(start_epoch / 1000);
        var total_duration = this.json_cache.info.total_duration;
        var loops = 0;

        while (start >= total_duration) {
            start -= total_duration;
            loops++;
        }

        console.log("Loop "+loops+" ("+total_duration+"secs/loop), beginning "+start_epoch.toString()+".\n"+
                    "Our current progress through it is "+Math.round(start/total_duration * 100)+"%.");

        return start;
    },
    getCurrentVideo: function() {
        var current_total = 0;
        var current_time = this.getCurrentTime();
        var the_key = {};

        $.each(this.json_cache.playlist, function (index, key) {
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
    spawn: {
        main: function() {
            var current = rtv.getCurrentVideo();
            var that = this;

            switch (rtv.json_cache.info.service) {
                case "youtube":
                        if (typeof YT !== "undefined") {
                            this.youtube(current);
                        } else {
                            rtv.youtube.init();
                        }
                    break;
                default:
                    this.html5(current);
            }
        },
        html5: function(current) {
            if ($("video").length == 0) { $("#container").html($("<video />")); }

            var instance = $("video")[0];
            rtv.player.instance = instance;

            $(instance).attr({
                preload: "none",
                controls: "",
                autoplay: "",
                src: rtv.json_cache.info.url_prefix + current.qualities[0].src
            });
            instance.addEventListener('ended', function() {
                setTimeout(function() {
                    that.spawn.main();
                }, 2000);
            }, false);

            rtv.seekTo(current.seek_to);
        },
        youtube: function(current) {
            if ($("#ytfodder").length == 0) {
                $("#container").html($("<div />", {id: 'ytfodder'}));

                rtv.player.instance = new YT.Player('ytfodder', {
                    height: '100%',
                    width: '100%',
                    playerVars: {
                        'autoplay': 1,
                        'rel': 0,
                        'start': current.seek_to,
                        'modestbranding': 0,
                        'showinfo': 1
                    },
                    videoId: current.qualities[0].src,
                    events: {
                        'onReady': rtv.youtube.playerOnReady,
                        'onStateChange': rtv.youtube.playerOnStateChange
                    }
                });
            } else {
                rtv.player.instance.loadVideoById({
                    'videoId': current.qualities[0].src,
                    'startSeconds': current.seek_to
                });
            }


        }
    },
    seekTo: function(to, player) {
        (player || rtv.player.instance).currentTime = (to || 0);
    },
    youtube: {
        done: false,
        init: function() {
            if (this.done == true) return;
            this.done = 1;

            //Spooky.
            var tag = document.createElement('script');
            tag.src = "https://www.youtube.com/player_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        },
        onAPIReady: function() {
            rtv.spawn.main();
        },
        playerOnReady: function(event) {},
        playerOnStateChange: function(event) {
            console.log("yt state", event.data);
            if (event.data == YT.PlayerState.ENDED) {
                setTimeout(function() {
                    rtv.spawn.main();
                }, 2000);
            }
        }
    }
}

function onYouTubePlayerAPIReady() { rtv.youtube.onAPIReady(); }

$(document).ready(function() {
    rtv.preinit(); //Do this proper
});