import {MdLink as icon} from 'react-icons/md'

export default {
  name: 'urlsTest',
  type: 'document',
  title: 'URLs test',
  icon,
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'myUrlField',
      type: 'url',
      title: 'Plain url',
      description: 'A plain URL field',
      // validation: (Rule) =>
      //   Rule.uri({
      //     scheme: ['http', 'https', 'mailto', 'tel'],
      //   }),
    },
    {
      name: 'relativeUri',
      type: 'url',
      title: 'Relative url',
      description: 'A relative URL field',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https', 'mailto', 'tel'],
          allowRelative: true,
        }),
    },
  ],
}
