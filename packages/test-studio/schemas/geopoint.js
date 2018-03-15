import React from 'react'
import icon from 'react-icons/lib/md/pin-drop'
import config from 'config:@sanity/google-maps-input'

export default {
  name: 'geopointTest',
  type: 'document',
  title: 'Geopoint test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title'
    },
    {
      name: 'location',
      type: 'geopoint',
      title: 'A geopoint',
      description: 'This is a geopoint field'
    }
  ],
  preview: {
    select: {
      title: 'title',
      location: 'location'
    },
    prepare({title, location}) {
      const {apiKey} = config
      return {
        title: title,
        subtitle:
          location &&
          `${Number(location.lat).toPrecision(5)}, ${Number(location.lng).toPrecision(5)}`,
        media: ({dimensions}) => {
          if (location && location.lat && location.lng && apiKey) {
            return (
              <img
                src={`https://maps.googleapis.com/maps/api/staticmap?zoom=11&center=${
                  location.lat
                },${location.lng}&size=${dimensions.width}x${dimensions.height}&key=${apiKey}`}
                alt={title}
              />
            )
          }
        }
      }
    }
  }
}
