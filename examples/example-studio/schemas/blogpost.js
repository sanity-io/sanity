import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'
import {FaBook as BookIcon} from 'react-icons/fa'

const pickFirst = (obj, keys) => {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  const found = keys.find((key) => key in obj)
  return obj[found]
}

const LANGUAGE_PRIORITY = ['nb', 'nn', 'en']

export default {
  name: 'blogpost',
  type: 'document',
  title: 'Blogpost',
  icon: BookIcon,
  preview: {
    select: {
      title: 'title',
      createdAt: '_createdAt',
      lead: 'lead',
      imageUrl: 'mainImage.asset.url',
      author: 'authorRef.name',
    },
    prepare(value) {
      const timeSince = distanceInWordsToNow(value.createdAt, {addSuffix: true})
      return Object.assign({}, value, {
        title: value.title ? pickFirst(value.title, LANGUAGE_PRIORITY) : '',
        subtitle: value.author ? `By ${value.author}, ${timeSince}` : timeSince,
        description: value.lead,
      })
    },
  },
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'localeString',
    },
    {
      name: 'localeSlug',
      title: 'Localized slug',
      type: 'localeSlug',
    },
    {
      name: 'publishAt',
      title: 'Publish at',
      type: 'datetime',
      description: 'Blogpost goes live at this date/time',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        timeStep: 60,
        calendarTodayLabel: 'Today',
      },
    },
    {
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'caption',
          type: 'string',
          title: 'Caption',
        },
      ],
    },
    {
      name: 'lead',
      title: 'Lead',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'localeBlockContent',
      title: 'Content',
    },
    {
      name: 'tags',
      title: 'tags',
      type: 'array',
      options: {
        layout: 'tags',
      },
      of: [{type: 'string'}],
    },
    {
      name: 'firstAuthor',
      title: 'Author',
      type: 'reference',
      to: {type: 'author'},
      required: true,
    },
    {
      name: 'coauthors',
      title: 'Co authors',
      type: 'array',
      options: {
        editModal: 'fold',
      },
      of: [
        {
          type: 'reference',
          title: 'Reference to co-author',
          to: {
            type: 'author',
          },
        },
      ],
      required: true,
    },
  ],
}
