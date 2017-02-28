export default {
  name: 'person',
  title: 'Person',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      description: 'Please use "Firstname Lastname" format'
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        auto: true
      }
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image'
    }
  ],

  // options: {
  //   preview: {
  //     fields: ['name', 'originalImageUrl'],
  //     prepare(value) {
  //       const {name, originalImageUrl} = value
  //       return {
  //         title: name,
  //         imageUrl: originalImageUrl
  //       }
  //     }
  //   }
  // }
}
