var creator = {
    init: function(){
        var that = this;
        this.playlistEmpty();
        
        $("#add").click(function(){
            //More than YT eventually
            players.youtube.spawn($("#insert-url")[0].value)
        });
        
        $("#export").click(function(){creator.exportList()});
        $("#reverse").click(function(){
            that.playlist.reverse();
            creator.generateVisibleList()
        });
        
        creator.generateVisibleList();
    },
    exportList: function(){
        if (this.playlist.length == 0) {
            alert("Current playlist is empty, try adding something.");
            return;
        }
        
        var list = {
            "info": {
                "name": (prompt("Playlist name") || "My First Playlist"),
                "shuffle": confirm("Shuffle playlist each loop?")
            },
            "playlist": this.playlist
        }
        
        if (this.playlistPlayers.length == 1) {
            list.info.player = this.playlistPlayers[0];
            
            for (i in list.playlist) {
                delete list.playlist[i].player
            }
        }
        
        prompt("Copy this playlist to your clipboard.\nIf you get a popup, allow it to test the playlist on RTV.",
                JSON.stringify(list));
        window.open("https://myrtv.github.io/#?custom")
    },
    playlist: [],
    playlistPlayers: [],
    playlistAdd: function(item){
        this.playlist.push(item);
        
        if (this.playlistPlayers.indexOf(item.player) < 0) {
            this.playlistPlayers.push(item.player);
        }
        
        this.generateVisibleList();
    },
    playlistEmpty: function(){
        this.playlist = [];
        this.playlistPlayers = [];
    },
    parse: {},
    generateVisibleList: function(){
        var rows = "";
        
        for (itemIndex in this.playlist) {
            var item = this.playlist[itemIndex];
            ++itemIndex;
            rows = rows + `<tr><td>${itemIndex}</td><td>${item.duration}s</td><td><small><a target="_blank" href="https://youtu.be/${item.src}">${item.src}</a></small></td><td>${item.name}</td></tr>` 
        }
        
        var table = `<table><tr><td>#</td><td>Duration</td><td>Source</td><td>Title</td></tr>${rows}</table>`
        $("#right").html(table);    
    }
}

$(document).ready(function(){creator.init()});