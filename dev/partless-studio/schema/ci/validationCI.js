export default {
  name: 'validationCI',
  type: 'document',
  title: 'Validation CI',
  fields: [
    {
      name: 'errorString',
      type: 'string',
      title: 'Error string',
      validation: (rule) => rule.min(5).error('Error message'),
    },
    {
      name: 'warningString',
      type: 'string',
      title: 'Warning string',
      validation: (rule) => rule.min(5).warning('Warning message'),
    },
    {
      name: 'infoString',
      type: 'string',
      title: 'Info string',
      validation: (rule) => rule.min(5).info('Info message'),
    },
  ],
}
