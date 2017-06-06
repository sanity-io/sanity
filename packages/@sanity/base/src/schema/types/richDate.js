export default {
  title: 'Rich Date',
  name: 'richDate',
  type: 'object',
  fields: [
    {
      name: 'utc',
      type: 'string', // todo: should be changed to 'date' when date strings are supported
      title: 'UTC',
      required: true
    },
    {
      name: 'local',
      type: 'string', // todo: should be changed to 'date' when date strings are supported
      title: 'Local'
    },
    {
      name: 'timezone',
      type: 'string',
      title: 'Timezone'
    },
    {
      name: 'offset',
      type: 'number',
      title: 'Offset'
    }
  ]
}
