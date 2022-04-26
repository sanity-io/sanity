import {LocationInput} from './LocationInput'

export const postDocumentType = {
  type: 'document',
  name: 'post',
  title: 'Post',

  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },

    {
      type: 'object',
      name: 'location',
      title: 'Location',

      components: {
        // Here we register our custom input component
        input: LocationInput,
      },

      // Even though we are making a custom input,
      // it is necessary to define the fields of our object
      fields: [
        {
          type: 'number',
          name: 'lat',
          title: 'Latitude',
        },
        {
          type: 'number',
          name: 'lng',
          title: 'Longitude',
        },
      ],
    },
  ],
}
