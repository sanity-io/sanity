import OrderLinesInput from './OrderLinesInput'

export default {
  name: 'orderlines',
  title: 'Order lines',
  type: 'object',
  inputComponent: OrderLinesInput,
  fields: [
    {
      name: 'orders',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'order',
          fields: [
            {name: 'description', type: 'string'},
            {name: 'number', type: 'number', readOnly: true}
          ]
        }
      ]
    },
    {name: 'nextOrderNumber', readOnly: true, title: 'Next order number', type: 'number'}
  ]
}
