import {MdCenterFocusWeak as icon} from 'react-icons/md'

export default {
  name: 'focusTest',
  type: 'document',
  title: 'Focus test',
  icon,
  fields: [
    {
      name: 'first',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'second',
      type: 'number',
      title: 'Num',
    },
    {
      name: 'someArray',
      type: 'array',
      title: 'An array',
      of: [
        {
          type: 'object',
          fields: [
            {name: 'first', type: 'string'},
            {name: 'focusTest', type: 'focusTest'},
          ],
        },
      ],
    },
    {
      name: 'someObject',
      type: 'object',
      title: 'An object',
      fields: [{name: 'first', type: 'string'}],
    },
  ],
}
