/* eslint-disable */

// my-custom-summarizers.js
const summarizers = {
  coordinates: (previous, current) => {
    // I want to handle if the location changes, and when previous and current has defined values
    if (
      previous && current &&
      previous.lat && previous.lng &&
      current.lat && current.lng && (
        previous.lat !== current.lat ||
        previous.lng !== current.lng
      )
    ) {
      return [
        {
          op: 'newLocation',
          type: 'map',
          from: {
            lat: previous.lat,
            lng: previous.lng
          },
          to: {
            lat: current.lat,
            lng: current.lng
          }
        }
      ]
    }

    // I don't want to handle more cases
    return null
  }
}

// my-custom-visualizers
const visualizers = {
  coordinates: {
    newLocation: {
      // eslint-disable-next-line react/display-name
      component: props => {
        const {op: operation, field, from, to} = props.item
        return (
          // This component shows an arrow from the old to the new position on a globe
          // eslint-disable-next-line react/react-in-jsx-scope
          <GoogleMaps
            markerFrom={{lat: from.lat, lng: from.lng}}
            markerTo={{lat: to.lat, lng: to.lng}}
          />
        )
      }
    }
  }
}

export default {
  summarizers
}
