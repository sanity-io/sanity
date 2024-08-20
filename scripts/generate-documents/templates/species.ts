import {type DocGenTemplate} from '../types'
import {loremString} from '../utils/lorem'

export const species: DocGenTemplate = (options) => ({
  _type: 'species',
  name: options.title,
  foo: 'bar',
  genus: 'Foo',
  species: 'Bar',
  description: loremString(options.size),
})
