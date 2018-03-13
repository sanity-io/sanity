
export default {
  type: 'document',
  name: 'invoice',
  title: 'Invoice',
  fields: [
    {
      name: 'identifier',
      type: 'string',
      title: 'Identifier'
    },
    {
      name: 'orderlines',
      type: 'orderlines',
      title: 'Order lines',
    }
  ]
}
