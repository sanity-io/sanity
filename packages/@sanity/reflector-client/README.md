# Low level client for the Reflector client to client messaging system

See also [the server project](https://github.com/sanity-io/reflector).

## Initializing

```
  import Reflector from '@sanity/reflector-client'
  import myConfiguredSanityClient from './myConfiguredSanityClient'

  channel = new Reflector(mySanityClient).connect('channelName')
```

## Listening

```
  channel.listen().subscribe(msg => {
    console.log(msg) // => {i: <sanity-identity>, m: <message>}
  })
```

## Sending
```
  channel.send({'hello': 'sanity!'})
```
