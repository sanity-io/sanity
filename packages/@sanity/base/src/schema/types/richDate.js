export default {
  title: 'Rich Date',
  name: 'richDate',
  type: 'object',
  fields: [
    {
      name: 'utc',
      type: 'date',
      title: 'UTC',
      required: true
    },
    {
      name: 'local',
      type: 'date',
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
