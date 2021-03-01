const CUSTOMER = {
  name: 'customer',
  type: 'object',
  fields: [
    {
      name: 'customerId',
      title: 'Customer ID',
      type: 'string',
    },
  ],
}

const PERSON = {
  name: 'person',
  type: 'object',
  title: 'Person',
  options: {
    preview: {
      fields: ['foo'],
      prepare(v) {
        return v
      },
    },
  },
  fields: [
    {
      name: 'firstName',
      title: 'First name',
      type: 'string',
    },
    {
      name: 'address',
      type: 'address',
      title: 'Address of person',
    },
    {
      name: 'image',
      type: 'image',
      fields: [{name: 'caption', type: 'string'}],
    },
    {
      name: 'customer',
      type: 'reference',
      to: {type: 'customer'},
    },
    {
      name: 'something',
      type: 'any',
      of: [{type: 'string'}, {type: 'number'}],
    },
  ],
}

const ADDRESS = {
  name: 'address',
  type: 'object',
  fields: [
    {name: 'zipcode', type: 'string'},
    {name: 'street', type: 'string'},
  ],
}
const RELATION = {
  name: 'relation',
  type: 'object',
  fields: [
    {
      name: 'name',
      type: 'string',
    },
    {
      name: 'related',
      type: 'person',
      options: {
        preview: {
          fields: ['bar'],
          prepare(v) {
            return v
          },
        },
      },
    },
  ],
}

export default {
  name: 'test',
  types: [PERSON, ADDRESS, CUSTOMER, RELATION],
}
