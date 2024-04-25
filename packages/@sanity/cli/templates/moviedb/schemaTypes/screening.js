import {defineField, defineType} from 'sanity'
import {MdLocalPlay as icon} from 'react-icons/md'

export default defineType({
  name: 'screening',
  title: 'Screening',
  type: 'document',
  icon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'E.g.: Our first ever screening of Gattaca',
    }),
    defineField({
      name: 'movie',
      title: 'Movie',
      type: 'reference',
      to: [{type: 'movie'}],
      description: 'Which movie are we screening',
    }),
    defineField({
      name: 'published',
      title: 'Published',
      type: 'boolean',
      description: 'Set to published when this screening should be visible on a front-end',
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'geopoint',
      description: 'Where will the screening take place?',
      hidden: true,
    }),
    defineField({
      name: 'beginAt',
      title: 'Starts at',
      type: 'datetime',
      description: 'When does the screening start?',
    }),
    defineField({
      name: 'endAt',
      title: 'Ends at',
      type: 'datetime',
      description: 'When does the screening end?',
    }),
    defineField({
      name: 'allowedGuests',
      title: 'Who can come?',
      type: 'string',
      options: {
        list: [
          {title: 'Members', value: 'members'},
          {title: 'Members and friends', value: 'friends'},
          {title: 'Anyone', value: 'anyone'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'infoUrl',
      title: 'More info at',
      type: 'url',
      description:
        'URL to imdb.com, rottentomatoes.com or some other place with reviews, stats, etc',
    }),
    defineField({
      name: 'ticket',
      title: 'Ticket',
      type: 'file',
      description: 'PDF for printing a physical ticket',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'movie.poster',
    },
  },
})
