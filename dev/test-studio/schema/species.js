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
  ],
  preview: {
    select: {
      name: 'name',
      genus: 'genus',
      species: 'species',
    },
    prepare(value) {
      return {
        title: [value.genus, value.species, value.name && `(${value.name})`]
          .filter(Boolean)
          .join(' '),
        subtitle: value.name,
      }
    },
  },
}
