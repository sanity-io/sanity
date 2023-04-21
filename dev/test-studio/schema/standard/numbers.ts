// import {TiSortNumerically as icon} from 'react-icons/ti'

import {defineType} from 'sanity'

export default defineType({
  name: 'numbersTest',
  type: 'document',
  title: 'Numbers test',
  // icon,
  preview: {
    select: {
      title: 'title',
      subtitle: 'myNumberField',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'myNumberField',
      type: 'number',
      title: 'Plain number',
      description: 'A plain number field',
    },
    {
      name: 'myCustomNumberField',
      type: 'customNumber',
      title: 'Number between 0 and 1000',
      description: 'A subclassed number, with validation!',
    },
    {
      name: 'testNumberWithListObjects',
      title: 'Test Number - List Objects',
      type: 'number',
      options: {
        list: [
          {value: 1, title: 'One'},
          {value: 2, title: 'Two'},
        ],
      },
    },
    {
      name: 'testNumberWithListObjectsAndNumbers',
      title: 'Test Number - List objects and numbers',
      type: 'number',
      options: {
        list: [{value: 1, title: 'One'}, {value: 2, title: 'Two'}, 3],
      },
    },
    {
      name: 'testNumberWithListValues',
      title: 'Test Number - List Values',
      type: 'number',
      options: {
        list: [1, 2],
      },
    },
    {
      name: 'readonlyField',
      type: 'number',
      title: 'A read only number',
      description: 'It may have a value, but it cannot be edited',
      readOnly: true,
    },
  ],
  orderings: [
    {name: 'asc', title: 'Asc', by: [{field: 'myNumberField', direction: 'asc'}]},
    {name: 'desc', title: 'Desc', by: [{field: 'myNumberField', direction: 'desc'}]},
    {
      title: 'Title',
      name: 'title',
      by: [
        {field: 'title', direction: 'asc'},
        {field: 'myNumberField', direction: 'asc'},
      ],
    },
  ],
})
