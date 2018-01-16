# rtv
A pseudo-live TV implementation to save bandwidth but still function normally.

**[See it in action, pseudo-live!](https://myrtv.github.io/)**

----

#### What does that even mean?
When you *tune in* to RTV it obtains a playlist, which has a defined starting point in history (yesterday, 10 years ago, whatever). It proceeds to determine, had that same playlist been repeating since it started, what is currently *on* right now.

#### Won't this use a ton of bandwidth?
**No!** Only if *you* let it. You only watch what is currently playing and the provider of the video is only active when there is at least one viewer so both sides benefit from only transferring what they must but maintaining sync while "offline".

#### Why not use something like a website that syncs YouTube videos, or a YouTube playlist?    
This is unmanaged and "continually broadcasts", even when there's nobody left to watch. It does not require someone to make a room, load up some videos, or even interact with it to maintain a sync each time somebody feels like watching. The stream is always available where it's expected to be.

#### Why are all these answers mostly the same?
Because it's that simple. There are only a few instances of smoke and mirrors to maintain the sync, most of the experience comes from the variety of channels and the intricate guide. It's a direct competitor to YouTube syncing sites, but also itself is a unique feature over them. It also works locally/self-hosted if you want to roll your own.

----

RTV provides a *ton* of channels, probably not as diverse as all would like. To alleviate that, [Custom Channels](https://github.com/myrtv/myrtv.github.io/wiki/Custom-Channels) are supported.

### How you can help RTV

 - The *Planned Features* section below
 - [Submit playlists](https://github.com/myrtv/myrtv.github.io/wiki/Playlist-Format)
 - Correct/improve playlists 

### Supported video providers
 - Direct links (site.com/video.mp4)
 - [YouTube](https://github.com/myrtv/myrtv.github.io/wiki/YouTube-Playlists)

### Planned Features
 - Search
 - ~~Playlist switching~~ *Done, the channel select window!*
 - ~~Playlist viewing~~ *Done, the guide!* 
   - Maybe browser desktop notification support
     - [Service workers](https://github.com/w3c/ServiceWorker/blob/master/explainer.md) (background task)
     - Receive run alerts. "first time only", "every time"?
 - ~~Playlist shuffling~~ *Done, seedrandom and Fisher Yates shuffle!*
 - ~~Custom playlist URLs~~ *[Done (not URLs), the channel select window!](https://github.com/myrtv/myrtv.github.io/wiki/Custom-Channels)*
 - Picture in Picture
   - Getting there, jQuery UI dialogs help a ton.
 - Quality selector
 - Audio track selector
   - The technology is simultaneously there and not there. *Send help.*
 - Manual sync adjustment for closer viewing with others
 - ~~Automatic resync (on button click)~~ *Done!*
 - ~~Chat~~ *Done!*
   - IRC. Powered, but not endorsed, by Rizon.
 
### Unplanned Features
