import {type DocGenTemplate} from '../types'
import {lorem} from '../utils/lorem-bytes'

export const species: DocGenTemplate = (options) => ({
  _type: 'species',
  name: options.title,
  foo: 'bar',
  genus: 'Foo',
  species: 'Bar',
  description: lorem(options.size),
})
