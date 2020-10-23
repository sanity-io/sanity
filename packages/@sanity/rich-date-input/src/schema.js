import RichDateInput from './RichDate'

export default {
  title: 'Rich Date',
  name: 'richDate',
  type: 'object',
  fields: [
    {
      name: 'utc',
      type: 'datetime',
      title: 'UTC',
      required: true,
    },
    {
      name: 'local',
      type: 'datetime',
      title: 'Local',
    },
    {
      name: 'timezone',
      type: 'string',
      title: 'Timezone',
    },
    {
      name: 'offset',
      type: 'number',
      title: 'Offset',
    },
  ],
  inputComponent: RichDateInput,
}
