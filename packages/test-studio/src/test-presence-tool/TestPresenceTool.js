import * as React from 'react'

import {streamingComponent} from 'react-props-stream'
import {scan, startWith, map} from 'rxjs/operators'
import {clients$, CLIENT_ID, setLocation} from 'part:@sanity/base/presence'

export const TestPresenceTool = streamingComponent(props$ => {
  return clients$.pipe(
    map(clients => {
      return (
        <div style={{padding: '4em'}}>
          You are client: {CLIENT_ID}
          {/*{clients.map(() => {*/}
          {/*  return (*/}
          {/*    <li>*/}
          {/*      /!*<PresenceCircle imageUrl={imageUrl} color={marker.color} text={initials} />*!/*/}
          {/*    </li>*/}
          {/*  )*/}
          {/*})}*/}
          <pre>{JSON.stringify(clients, null, 2)}</pre>
          <button onClick={() => setLocation({path: ['button', 1]})}>1</button>
        </div>
      )
    })
  )
})
