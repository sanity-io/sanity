import {type DocGenTemplate} from '../types'
import {loremString} from '../utils/lorem'

export const validation: DocGenTemplate = (options) => ({
  _type: 'validationTest',
  arrayOfSlugs: [
    {
      _type: 'slugEmbed',
      sku: {
        _type: 'slug',
        current: 'foo',
      },
    },
  ],
  body: [
    {
      _type: 'block',
      children: [
        {
          _type: 'span',
          marks: [],
          text: loremString(options.size / 2),
        },
      ],
      markDefs: [],
      style: 'normal',
    },
  ],
  bymonth: [11],
  checkbox: true,
  dropdown: 'one',
  infoValidation: 'moop',
  intro: loremString(options.size / 2),
  lowestTemperature: 50,
  myFancyUrlField: 'http://www.sanity.io',
  myUrlField: 'https://www.sanity.io',
  radio: 'one',
  relativeUrl: '/foo/bar',
  slug: {
    _type: 'slug',
    current: 'slug',
  },
  switch: false,
  title: options.title,
  titleCase: 'bar',
  translations: {
    no: 'asdasdsad',
  },
})
