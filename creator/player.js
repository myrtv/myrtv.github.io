var players = {
    instance: {},
    html5: {
        spawn: function(){

        }
    },
    youtube: {
        lastIndex: -2,
        spawn: function(src, target){
            this.lastIndex = -2;
            
            try {
                players.instance.destroy();
            } catch(a) {}
            
            var videoId;
            var playerVars = {
                'autoplay': 0,
                'rel': 0,
                'start': 0,
				'mute': 1
            }
            
            if (/youtube\.com\/.*?(?:list=)(\w+)/.test(src)) { /* Playlist */
                playerVars.listType = "playlist"
                playerVars.list = src.match(/youtube\.com\/.*?(?:list=)(\w+)/).pop();
                src = '';
            } else {
                videoId = src.match(/youtu(be|.be)?(\.com)?\/(?:watch\?v=)?([a-zA-Z0-9_-]+)/);
                
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
                        if (a.data !== 1) return;
						
						if (players.youtube.lastIndex == players.instance.getPlaylistIndex()) {
							players.instance.stopVideo();
							return;
						}
                        
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