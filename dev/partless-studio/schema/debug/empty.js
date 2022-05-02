export default {
  name: 'empty',
  type: 'document',
  title: 'Empty',
  description: 'Do not put content here',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'obj',
      title: 'Obj',
      type: 'object',
      fields: [{name: 'objName', type: 'string'}],
    },
  ],
}
