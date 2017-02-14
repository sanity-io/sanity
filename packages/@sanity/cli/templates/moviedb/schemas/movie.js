export default {
  name: 'movie',
  title: 'Movie',
  type: 'object',
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
      type: 'text',
      multiline: true
    },
    {
      name: 'releaseDate',
      title: 'Release date',
      type: 'date'
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
      type: 'image'
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
    fields: {
      title: 'title',
      date: 'releaseDate'
    },
    prepare(selection) {
      const {title, date} = selection
      return {
        title: title,
        subtitle: date.split('-')[0]
      }
    }
  }

}
