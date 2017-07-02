# rtv
A pseudo-live TV implementation to save bandwidth but still function normally.

**[See it in action, pseudo-live!](https://myrtv.github.io/)**

----

#### What does pseudo-live TV mean?
*Fake*-live TV. It just keeps on going.

When you *tune in* to RTV it obtains a playlist, which has a defined starting point in history (yesterday, 10 years ago, whatever). It proceeds to determine, had that same playlist been repeating since it started, what is currently *on* right now.

----

RTV provides a *ton* of channels, probably not as diverse as all would like. To alleviate that, [Custom Channels](https://github.com/myrtv/myrtv.github.io/wiki/Custom-Channels) are supported.

#### But wait, won't this use a ton of bandwidth?
**Nope!** Only if *you* let it. It's a sort of but not really hybrid streaming, you download only what you will see but RTV steers you to what the synced video should be.

To give some numbers, *Awesome Games Done Quick 2013* in 512kbps (lowest quality) is 41.4GB total on [Internet Archive](https://archive.org/). However, unless you leave the stream running 24/7 you should never come near that amount within a given loop of it (which is 156 hours).

### How you can help RTV

 - The *Planned Features* section below
 - [Submit playlists](https://github.com/myrtv/myrtv.github.io/wiki/Playlist-Format)
 - Correct/improve playlists 

### Supported video providers
 - Direct links (site.com/video.mp4)
 - [YouTube](https://github.com/myrtv/myrtv.github.io/wiki/YouTube-Playlists)

### Planned Features
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
 
### Unplanned Features
 - Chat (*actually live real time chat*, not chat replay)
   - Maybe, using a javascript client and IRC or a customizable iframe. But don't hold your breath.
   
---

**Why not just use something like a website that syncs YouTube videos, or... a YouTube playlist?**    
This is unmanaged and "continually broadcasts" no matter what. It just goes, configuration-free. Anybody can stop by and watch the same thing, and when there's nobody left it'll still be where it needs to be on return. It's accomplishes this with a defined starting point to ensure everyone can sync up, at any time, without a *server* managing.
