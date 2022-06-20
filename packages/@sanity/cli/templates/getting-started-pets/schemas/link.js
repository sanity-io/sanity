import {LinkIcon} from '@sanity/icons'

export default {
  title: 'Link',
  name: 'link',
  type: 'document',
  icon: LinkIcon,
  fields: [
    {
      title: 'Name',
      name: 'name',
      type: 'string',
    },
    {
      title: 'URL',
      name: 'href',
      type: 'url',
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Open in new window',
      name: 'openInNewWindow',
      type: 'boolean',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'href',
    },
  },
}
