# Low level client for the Reflector client to client messaging system

Implements the messaging protocol that supports the Sanity real time presence
exprience.

## Initializing

``` js
  import Reflector from '@sanity/reflector-client'
  import myConfiguredSanityClient from './myConfiguredSanityClient'

  channel = new Reflector(mySanityClient).connect('channelName')
```

## Listening

``` js
  channel.listen().subscribe(msg => {
    console.log(msg) // => {i: <sanity-identity>, m: <message>}
  })
```

## Sending
``` js
  channel.send({'hello': 'sanity!'})
```
