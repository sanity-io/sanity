export default {
  name: 'pertEstimate',
  type: 'object',
  title: 'PERT-estimate',
  fields: [
    {
      title: 'Optimistic estimate',
      name: 'optimistic',
      type: 'number',
    },
    {
      title: 'Nominal estimate',
      name: 'nominal',
      type: 'number'
    },
    {
      title: 'Pessimistic estimate',
      name: 'pessimistic',
      type: 'number'
    },
    {
      title: 'Pert estimate',
      name: 'calculated',
      type: 'number',
      readOnly: true
    }
  ]
}
