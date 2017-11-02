# PresenceStore — Client side presence channel handler

The purpose of this class is to connect to the reflector service and provide a consistent view
of what everybody else on the channel is "doing", i.e. their state. This supports the real time
presence experience in Sanity.

## Usage

``` js
import PresenceStore from '@sanity/presence-store'
import Reflector from '@sanity/reflector-client'
import myConfiguredSanityClient from './myConfiguredSanityClient'

const presenceStore = new Presence(new Reflector(myConfiguredSanityClient).connect('channelName'))

// Subscribe to state changes about all other users on the channel
presenceStore.presence.subscribe(allTheirStates => {
  // Called with an array of all known states whenever it changes
  console.log(allTheirStates)
})

// Report my state to the other clients on the channel
presenceStore.reportMyState({
  location: "/fnah",  // The format of state reports is app-specific, can be any JSON'able object, but keep it
  activity: "editing" // short and sweet. At the time of writing we don't know how the Sanity studio will use it.
})

// Do this to allow the presence store to notify the others that we left. Uses
// navigator.sendBeacon to get the message out even though the window is closing.
window.addEventListener("beforeunload", function(e){
  presenceStore.close()
}, false);
```

## Format of state reports

The reports from the presence subscription (i.e. `allTheirStates` as seen above) will look someting like this:

``` js
[
  {
    identity: "<a sanity identity>",
    session: "<an UUID to identify the browser window>",
    // and now whatever this client reported to reportMyState:
    location: "/fnah",
    activity: "editing"
  },
  // more of these ...
]
```

The order of the reports is consistent between calls, the object identity of each report is identical
until it changes, and is always new when it does change.

You don't see your own state reported in this window in the list, but you _will_ see state reported
for your identity in other windows.
