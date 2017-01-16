var rtv = {
    json_cache: {},
    preinit: function() {
        var that = this;

        $('#remote').on('change', function() {
            that.init(this.value);
        })
        
        $("video")[0].addEventListener('ended', function() {
            setTimeout(function() {
                that.spawn();
            }, 2500);
        }, false);

        this.init();
    },
    init: function(path) {
        var that = this;

        $.getJSON((path || 'playlists/gdq/agdq2013.min.json'), function (data) {
            //Offline testing and not using a virtual server is weird, don't judge me.
            that.json_cache = (data.playlist) ? data : JSON.parse(data.responseText);

            //Determine total length
            that.json_cache.info.total_duration = 0;
            $.each(that.json_cache.playlist, function (index, key) {
                that.json_cache.info.total_duration += key.duration;
            })

            that.getCurrentTime();
            that.spawn();
        });
    },
    getCurrentTime: function() {
        //It's close, but not enough.
        var start = Math.round(new Date() / 1000) - Math.round(new Date(this.json_cache.info.start_epoch_gtm * 1000) / 1000);
        var total_duration = this.json_cache.info.total_duration;

        while (start >= total_duration) {
            start -= total_duration;
        }

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
                console.log('no not here');
            }
        });

        return the_key;
    },
    spawn: function() {
        var current = this.getCurrentVideo();

        $("video").attr({preload: "none", controls: "", autoplay: "", src: this.json_cache.info.url_prefix + current.qualities[0].src});
        this.seekTo(current.seek_to);
    },
    seekTo: function(to) {
        $("video")[0].currentTime = (to || 0);
    }
}

$(document).ready(function() {
    //Do this proper
    rtv.preinit();
});