const nestedItemTypeA = {
  type: 'object',
  name: 'itemA',
  title: 'Item A',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
}

const nestedItemTypeB = {
  type: 'object',
  name: 'itemB',
  title: 'Item B',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
  ],
}

// const nestedItemTypeC = {
//   type: 'object',
//   name: 'itemC',
//   title: 'Item C',
//   fields: [
//     {
//       type: 'string',
//       name: 'title',
//       title: 'Title',
//     },
//   ],
// }

// const nestedItemTypeD = {
//   type: 'object',
//   name: 'itemD',
//   title: 'Item D',
//   fields: [
//     {
//       type: 'string',
//       name: 'title',
//       title: 'Title',
//     },
//   ],
// }

const itemType = {
  type: 'object',
  name: 'item',
  title: 'Item',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'string',
      name: 'name',
      title: 'Name',
    },
    {
      type: 'string',
      name: 'id',
      title: 'ID',
    },
    {
      type: 'slug',
      name: 'slug',
      title: 'Slug',
    },
    {
      type: 'array',
      name: 'nestedItems',
      title: 'Nested items',
      of: [
        nestedItemTypeA,
        nestedItemTypeB,
        // nestedItemTypeC,
        // nestedItemTypeD
      ],
    },
  ],
}

export default {
  type: 'document',
  name: 'arrayInArray',
  title: 'Array in Array',
  fields: [
    {type: 'string', name: 'title', title: 'Title'},
    {type: 'array', name: 'items', title: 'Items', of: [itemType]},
  ],
}
