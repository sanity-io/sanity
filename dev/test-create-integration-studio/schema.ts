export const schemaTypes = [
  {
    name: 'create-pet',
    title: 'Pet',
    type: 'document',
    fields: [
      {
        name: 'name',
        title: 'name',
        type: 'string',
      },
      {
        name: 'slug',
        title: 'Slug',
        type: 'slug',
      },
      {
        name: 'bio',
        title: 'Bio',
        type: 'array',
        of: [{type: 'block'}],
      },
      {
        name: 'photo',
        title: 'Photo',
        type: 'image',
      },
      {
        name: 'isFeatured',
        title: 'Featured',
        type: 'boolean',
      },
      {
        name: 'dateOfBirth',
        title: 'Date of birth',
        type: 'date',
      },
      {
        name: 'publishedAt',
        title: 'Publish date',
        type: 'datetime',
      },
      {
        name: 'homePosition',
        title: 'Home',
        type: 'geopoint',
      },
      {
        name: 'rating',
        title: 'Rating',
        type: 'number',
      },
      {
        name: 'bestFriend',
        title: 'Best friend',
        type: 'reference',
        to: [{type: 'create-pet'}],
      },
      {
        name: 'pedigree',
        title: 'Pedigree',
        description: 'PDF, preferably',
        type: 'file',
      },
      {
        name: 'contactInfo',
        title: 'Contact info',
        type: 'contactInfo',
      },
    ],
  },
  {
    name: 'contactInfo',
    title: 'Contact info',
    type: 'object',
    fields: [
      {
        name: 'email',
        title: 'Email',
        type: 'email',
      },
      {
        name: 'url',
        title: 'URL',
        type: 'url',
      },
    ],
  },
]
