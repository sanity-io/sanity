export const generalCard = {
  name: 'generalCard',
  type: 'object',
  fields: [
    {
      name: 'children',
      type: 'array',
      of: [{type: 'block'}, {type: 'phoneList'}]
    }
  ]
}

export const phoneList = {
  name: 'phoneList',
  type: 'object',
  fields: [
    {type: 'string', name: 'name'},
    {
      type: 'array',
      name: 'children',
      title: 'Items',
      of: [
        {
          type: 'phoneListItem'
        }
      ]
    }
  ]
}
export const phoneListItem = {
  name: 'phoneListItem',
  type: 'object',
  fields: [
    {type: 'string', name: 'name'},
    {
      name: 'number',
      type: 'string'
    }
  ]
}
export const childrenRepro = {
  name: 'page',
  type: 'document',
  title: 'Children issue repro',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string'
    },
    {
      name: 'children',
      title: 'Content',
      type: 'array',
      of: [{type: 'generalCard'}]
    }
  ]
}
