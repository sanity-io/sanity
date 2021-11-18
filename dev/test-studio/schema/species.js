export default {
  name: 'species',
  title: 'Species',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Common name',
      type: 'string',
    },
    {
      name: 'genus',
      title: 'Genus',
      type: 'string',
    },
    {
      name: 'species',
      title: 'Species',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
  ],
  preview: {
    select: {
      name: 'name',
      genus: 'genus',
      species: 'species',
      media: 'image',
    },
    prepare(value) {
      return {
        ...value,
        title: [value.genus, value.species, value.name && `(${value.name})`]
          .filter(Boolean)
          .join(' '),
        subtitle: value.name,
      }
    },
  },
}
