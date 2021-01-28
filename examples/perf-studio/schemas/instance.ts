export const cpu = {
  name: 'cpu',
  title: 'CPU',
  type: 'object',
  fields: [
    {name: 'model', type: 'string'}, //
    {name: 'speed', type: 'number'}, // (in MHz)
  ],
}
export const instance = {
  name: 'instance',
  title: 'Instance',
  type: 'document',

  preview: {
    select: {
      title: 'name',
    },
  },
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {name: 'type', type: 'string', readOnly: true},
    {name: 'version', type: 'string', readOnly: true},
    {name: 'hostname', type: 'string', readOnly: true},
    {name: 'platform', type: 'string', readOnly: true},
    {name: 'cpus', type: 'array', of: [{type: 'cpu'}], readOnly: true},
    {name: 'arch', type: 'string', readOnly: true},
  ],
}
