import {Schema} from '@sanity/schema'
import {SearchableType} from '../../../../../search'
import {filterDefinitions} from '../definitions/defaultFilters'
import {operatorDefinitions} from '../definitions/operators/defaultOperators'
import {SearchFilter} from '../types'
import {createFieldDefinitions} from './createFieldDefinitions'
import {generateFilterQuery, narrowDocumentTypes, validateFilter} from './filterUtils'

const mockSchema = Schema.compile({
  name: 'default',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {name: 'age', type: 'number'},
      ],
    },
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [
        {name: 'name', type: 'string'},
        {
          name: 'author',
          type: 'reference',
          to: [{type: 'author'}],
        },
      ],
    },
  ],
})

const mockFieldDefinitions = createFieldDefinitions(mockSchema, filterDefinitions)

// Author + Article name
const nameFieldId = mockFieldDefinitions.find((d) => d.fieldPath === 'name')?.id
const stringFilter: SearchFilter = {
  fieldId: nameFieldId,
  filterName: 'string',
  operatorType: 'stringEqual',
  value: 'foo',
}

// Author age
const ageFieldId = mockFieldDefinitions.find((d) => d.fieldPath === 'age')?.id
const numberFilter: SearchFilter = {
  fieldId: ageFieldId,
  filterName: 'number',
  operatorType: 'numberEqual',
  value: 42,
}

const mockFilters = [numberFilter, stringFilter]

describe('generateFilterQuery', () => {
  it('should generate a filter query', () => {
    const filter = generateFilterQuery({
      filters: mockFilters,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })

    expect(filter).toEqual('age == 42 && name == "foo"')
  })
})

describe('narrowDocumentTypes', () => {
  it('should create a list of narrowed document types based on selected filters', () => {
    const narrowedDocumentTypes = narrowDocumentTypes({
      fieldDefinitions: mockFieldDefinitions,
      filters: mockFilters,
      types: [],
    })
    expect(narrowedDocumentTypes).toEqual(['author'])
  })

  it('should create a list of narrowed document types based on selected types', () => {
    const selectedTypes: SearchableType[] = [
      {
        // eslint-disable-next-line camelcase
        __experimental_search: [],
        name: 'article',
        title: 'Article',
      },
      {
        // eslint-disable-next-line camelcase
        __experimental_search: [],
        name: 'gallery',
        title: 'Gallery',
      },
    ]

    const narrowedDocumentTypes = narrowDocumentTypes({
      fieldDefinitions: mockFieldDefinitions,
      filters: [],
      types: selectedTypes,
    })
    expect(narrowedDocumentTypes).toEqual(['article', 'gallery'])
  })
})

describe('validateFilter', () => {
  it('should not allow filters with invalid filter names', () => {
    const invalidFilter: SearchFilter = {
      filterName: '_invalid',
      operatorType: 'defined',
    }

    const isValid = validateFilter({
      filter: invalidFilter,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })
    expect(isValid).toEqual(false)
  })

  it('should not allow filters with invalid field IDs', () => {
    const invalidFilter: SearchFilter = {
      fieldId: '_invalid',
      filterName: 'string',
      operatorType: 'defined',
    }

    const isValid = validateFilter({
      filter: invalidFilter,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })
    expect(isValid).toEqual(false)
  })

  it('should not allow filters with invalid operator definitions', () => {
    const invalidFilter: SearchFilter = {
      fieldId: ageFieldId,
      filterName: 'number',
      operatorType: '_invalid',
    }

    const isValid = validateFilter({
      filter: invalidFilter,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })
    expect(isValid).toEqual(false)
  })

  it(`should not allow filters that don't return filter values`, () => {
    const invalidFilter: SearchFilter = {
      fieldId: ageFieldId,
      filterName: 'number',
      operatorType: 'numberEqual',
    }

    const isValid = validateFilter({
      filter: invalidFilter,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })
    expect(isValid).toEqual(false)
  })

  it(`should allow pinned filters that dont have fieldIds`, () => {
    const invalidFilter: SearchFilter = {
      filterName: 'updatedAt',
      operatorType: 'dateTimeLast',
      value: {
        unit: 'days',
        unitValue: 10,
      },
    }

    const isValid = validateFilter({
      filter: invalidFilter,
      fieldDefinitions: mockFieldDefinitions,
      filterDefinitions,
      operatorDefinitions,
    })
    expect(isValid).toEqual(true)
  })
})
