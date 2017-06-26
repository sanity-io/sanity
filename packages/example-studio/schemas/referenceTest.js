export default {
  name: 'referenceTest',
  type: 'object',
  title: 'Reference Test',
  fields: [
    {name: 'title', type: 'string'},
    {name: 'selfRef', type: 'reference', to: {type: 'referenceTest'}}
  ]
}
