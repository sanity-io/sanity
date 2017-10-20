export default {
  name: 'movie',
  title: 'Movie',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      required: true
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        auto: true
      }
    },
    {
      name: 'overview',
      title: 'Overview',
      type: 'blockContent'
    },
    {
      name: 'releaseDate',
      title: 'Release date',
      type: 'datetime'
    },
    {
      name: 'externalId',
      title: 'External ID',
      type: 'number'
    },
    {
      name: 'popularity',
      title: 'Popularity',
      type: 'number'
    },
    {
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      options: {
        hotspot: true
      }
    },
    {
      name: 'castMembers',
      title: 'Cast Members',
      type: 'array',
      of: [{type: 'castMember'}]
    },
    {
      name: 'crewMembers',
      title: 'Crew Members',
      type: 'array',
      of: [{type: 'crewMember'}]
    }
  ],

  preview: {
    select: {
      title: 'title',
      date: 'releaseDate.utc',
      imageUrl: 'poster.asset.url'
    },
    prepare(selection) {
      const {date, imageUrl} = selection
      return Object.assign({}, selection, {
        subtitle: date && date.utc ? date.utc.split('-')[0] : '',
        imageUrl: imageUrl ? `${imageUrl}?w=100` : imageUrl
      })
    }
  }
}
