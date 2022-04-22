import Schema from '@sanity/schema'
import {getSearchableTypes} from '../src/search/common/utils'

const person = {
  type: 'document',
  name: 'person',
  title: 'Person',
  fields: [
    {
      type: 'string',
      name: 'name',
    },
  ],
}

const article = {
  type: 'document',
  name: 'article',
  title: 'Article',
  fields: [{type: 'string', name: 'headline'}],
}

const systemDoc = {
  type: 'document',
  name: 'sanity.something',
  title: 'Internal schema',
  fields: [{type: 'boolean', name: 'name'}],
}

describe('getSearchableTypes', () => {
  it('contains the user defined documents', () => {
    const schema = new Schema({
      name: 'test',
      types: [person, article, systemDoc],
    })
    const searchTypes = getSearchableTypes(schema)
    expect(searchTypes.map((s) => s.name)).toEqual(['person', 'article'])
  })

  it('filters out __experimental_search_ignore === true', () => {
    const hiddenPerson = {
      ...person,
      // eslint-disable-next-line camelcase
      __experimental_search_ignore: true,
    }

    const schema = new Schema({
      name: 'test',
      types: [hiddenPerson, article],
    })

    const searchTypes = getSearchableTypes(schema)
    expect(searchTypes.map((s) => s.name)).toEqual(['article'])
  })
})
