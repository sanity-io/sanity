import {GoMicroscope as icon} from 'react-icons/go'

export default {
  name: 'proteinTest',
  title: 'Protein Test',
  type: 'document',
  icon,
  fields: [
    {
      name: 'title',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'protein',
      title: 'Protein',
      type: 'protein',
    },
  ],
}
