// Todo: remove this eventually
export default {
  __legacy: true,
  title: 'Rich Date',
  name: 'richDate',
  type: 'object',
  fields: [
    {
      name: 'utc',
      type: 'datetime',
      title: 'UTC',
      required: true
    },
    {
      name: 'local',
      type: 'datetime',
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
