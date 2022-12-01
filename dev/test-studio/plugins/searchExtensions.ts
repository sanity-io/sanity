import {ClockIcon, InfoOutlineIcon} from '@sanity/icons'
import {
  definePlugin,
  defineSearchFilter,
  defineSearchFilterOperators,
  defineSearchOperator,
  type SearchOperatorType,
} from 'sanity'

type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key]
}

const customOperators = [
  defineSearchOperator({
    buttonLabel: 'contains custom',
    groqFilter: ({fieldPath}) => `${fieldPath} match 'custom'`,
    label: 'Contains custom',
    type: 'containsCustom',
  }),
  defineSearchOperator({
    groqFilter: () => `dateTime(_updatedAt) > dateTime(now()) - 60*60*24`,
    label: 'updated in the last day',
    type: 'customUpdatedInTheLastDay',
  }),
] as const

const customFilters = [
  defineSearchFilter({
    fieldPath: '_id',
    icon: InfoOutlineIcon,
    group: 'Custom filters',
    operators: [
      {name: 'stringMatches', type: 'item'},
      {name: 'stringNotMatches', type: 'item'},
      {type: 'divider'},
      {name: 'stringEqual', type: 'item'},
      {name: 'stringNotEqual', type: 'item'},
    ],
    title: 'ID',
    name: 'id',
    type: 'pinned',
  }),
  defineSearchFilter({
    description: 'This custom filter returns all documents updated in the last 24 hours',
    group: 'Custom filters',
    icon: ClockIcon,
    name: 'customUpdatedLastDay',
    operators: [{name: 'customUpdatedInTheLastDay', type: 'item'}],
    title: 'Updated in the last day',
    type: 'pinned',
  }),
]

type OperatorExtensions = Mutable<typeof customOperators>
type OperatorExtensionType = OperatorExtensions[number]['type']

export const searchExtensions = definePlugin({
  name: 'search-extensions',
  search: {
    operators: customOperators as OperatorExtensions,
    filters: (prev, context) => {
      if (!context.currentUser?.roles.some((r) => r.name === 'administrator')) {
        return prev
      }
      // Add our custom filters and append a custom operator to all string + text field filters
      return [...prev, ...customFilters].map((filter) => {
        if (!['string', 'text'].includes(filter.type)) {
          return filter
        }
        return {
          ...filter,
          operators: [
            ...filter.operators,
            ...defineSearchFilterOperators<SearchOperatorType | OperatorExtensionType>([
              {type: 'divider'},
              {type: 'item', name: 'containsCustom'},
            ]),
          ],
        }
      })
    },
  },
})
