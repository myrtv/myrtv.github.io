var players = {
    instance: {},
    html5: {
        spawn: function(){

        }
    },
    youtube: {
        lastIndex: -1,
        spawn: function(src, target){
            this.lastIndex = -1;
            
            try {
                players.instance.destroy();
            } catch(a) {}
            
            var videoId;
            var playerVars = {
                'autoplay': 0,
                'rel': 0,
                'start': 0
            }
            
            if (/youtube\.com\/.*?(?:list=)(\w+)/.test(src)) { /* Playlist */
                playerVars.listType = "playlist"
                playerVars.list = src.match(/youtube\.com\/.*?(?:list=)(\w+)/).pop();
                src = null;
            } else {
                videoId = src.match(/youtu(be|.be)?(\.com)?\/(?:watch\?v=)?(\w+)/);
                
                if (videoId !== null && videoId.length > 1) {
                    src = videoId.pop();
                }
            }

            var temp = new YT.Player((target || "video-test"), {
                playerVars: playerVars,
                videoId: src,
                events: {
                    'onReady': function(a){
                        players.instance.playVideo();
                    },
                    'onStateChange': function(a){
                        if (a.data !== -1 || players.youtube.lastIndex == players.instance.getPlaylistIndex()) return;
                        
                        players.youtube.lastIndex = players.instance.getPlaylistIndex();

                        var item = {
                            name: (a.target.getVideoData().title || "Untitled"),
                            duration: Math.ceil(a.target.getDuration()),
                            src: a.target.getVideoData().video_id,
                            player: "youtube"
                        };
                        
                        if (item.duration <= 0) {
                            console.error(item.src, "Invalid ID?");
                            return;
                        }
                        
                        creator.playlistAdd(item);
                        
                        a.target.nextVideo();
                    }
                }
            });

            players.instance = temp;
        }
    }
}