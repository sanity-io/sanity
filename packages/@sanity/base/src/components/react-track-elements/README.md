# react-track-elements

A React utility for tracking elements and their positions
relative to a common parent. Useful for rendering overlays.

Note: work in progress

## Usage

```jsx
import {create} from 'react-track-element'

const {Tracker, Reporter} = create()

function Overlay({children, trackerRef, regions}) {
  return (
    <div>
      <div ref={trackerRef}>{children}</div>
      {regions.map((region, i) => (
        <div style={{position: 'absolute', top: region.rect.top}}></div>
      ))}
    </div>
  )
}

<Tracker renderWith={Regions}>
  <Reporter>Hello</Reporter>
</Tracker>
```
