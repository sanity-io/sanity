import {EarthGlobeIcon} from '@sanity/icons'
import {defineType} from 'sanity'
// import config from 'config:@sanity/google-maps-input'

export default defineType({
  name: 'geopointTest',
  type: 'document',
  title: 'Geopoint test',
  icon: EarthGlobeIcon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'location',
      type: 'geopoint',
      title: 'A geopoint',
      description: 'This is a geopoint field',
    },
    {
      name: 'arrayOfLocations',
      type: 'array',
      of: [
        {
          type: 'geopoint',
          title: 'A geopoint',
          description: 'This is a geopoint field',
        },
      ],
    },
  ],
  preview: {
    select: {
      title: 'title',
      location: 'location',
    },
    prepare({title, location}) {
      // @todo
      const apiKey = undefined
      // const {apiKey} = config
      return {
        title: title,
        subtitle:
          location &&
          `${Number(location.lat).toPrecision(5)}, ${Number(location.lng).toPrecision(5)}`,
        media({dimensions}) {
          if (!location || !location.lat || !location.lng || !apiKey) {
            return null
          }
          return (
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?zoom=11&center=${location.lat},${location.lng}&size=${dimensions.width}x${dimensions.height}&key=${apiKey}`}
              alt={title}
            />
          )
        },
      }
    },
  },
})
