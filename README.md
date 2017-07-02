# rtv
A pseudo-live TV implementation to save bandwidth but still function normally.

**[See it in action, pseudo-live!](https://myrtv.github.io/)**

----

**What does pseudo-live TV mean?**    
Exactly what it says on the tin, but in another word: *fake*-live TV.

*Normally* when you turn on a television, provided it has the ability to, you're presented a channel that has been broadcasting without a care in the world about you. It didn't stop and wait for you, it didn't expect your return. This is the same, except with pre-recorded content on a playlist that is expected to play and loop for eternity.

When you *tune in* to RTV it obtains a playlist, which has a defined starting point in history (yesterday, 10 years ago, whatever). It proceeds to determine, had that same playlist been repeating since it started, what is currently *on* right now.

----

At the time of writing, RTV provides a few *"channels"* of the various *Awesome Games Done Quick* (and *Summer Games Done Quick*) charity marathons which are generously hosted on [Internet Archive](https://archive.org/) ([support them if you can!](https://blog.archive.org/2016/11/29/help-us-keep-the-archive-free-accessible-and-private/)).

*Note: I am not affiliated with Internet Archive, but their service enables this one!*

**But wait, won't this use a ton of bandwidth?**    
**Nope!** Well yes the bandwidth usage can get large, but only if *you* let it. By default the playlists, and by extension their parsers, sort and prioritize the lowest size (and quality) streams but also provides access to higher.

This is no different than streaming (or downloading) from the Internet Archive directly. They also properly support streaming video so you only get what you will see (more obvious when you sync to the middle of a *live* broadcast).

To give some numbers, *Awesome Games Done Quick 2013* in 512kbps (lowest quality) is 41.4GB total. However, unless you leave the stream running 24/7 you should never come near that amount within a given loop of it (which is 156 hours).

### How you can help RTV

 - The *Planned Features* section below
 - [Submit playlists](https://github.com/myrtv/myrtv.github.io/wiki/Playlist-Format)
 - Correct/improve playlists 

### Supported video providers
 - Direct links (site.com/video.mp4)
 - YouTube ([c7fa910269a59d15e488d273b57de9dd565a7289](https://github.com/myrtv/myrtv.github.io/commit/c7fa910269a59d15e488d273b57de9dd565a7289))

#Planned Features
 - ~~Playlist switching~~ *Done, the channel select window!*
 - ~~Playlist viewing~~ *Done, the guide!* 
   - Maybe browser desktop notification support
     - [Service workers](https://github.com/w3c/ServiceWorker/blob/master/explainer.md) (background task)
     - Receive run alerts. "first time only", "every time"?
 - ~~Playlist shuffling~~ *Done, seedrandom and Fisher Yates shuffle!*
 - ~~Custom playlist URLs~~ *Done (not URLs), the channel select window!*
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
This is unmanaged and "continually broadcasts" no matter what. It just goes, configuration-free. Anybody can stop by and watch the same thing, and when there's nobody left it'll still be where it needs to be on return.

It's able to do this because it has a defined starting point to ensure everyone can sync up, at any time, without a *server* telling them otherwise.
