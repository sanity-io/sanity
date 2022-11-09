import {ClockIcon} from '@sanity/icons'
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
    type: 'containsCustom',
    label: 'Contains custom',
    fn: ({fieldPath}) => `${fieldPath} match 'custom'`,
  }),
  defineSearchOperator({
    type: 'customUpdatedInTheLastDay',
    label: 'updated in the last day',
    fn: () => `dateTime(_updatedAt) > dateTime(now()) - 60*60*24`,
  }),
  defineSearchOperator({
    type: 'customContainsAuthors',
    label: 'updated in the last day',
    fn: () => `dateTime(_updatedAt) > dateTime(now()) - 60*60*24`,
  }),
] as const

const customFilters = [
  defineSearchFilter({
    description: 'This custom filter returns all documents updated in the last 24 hours',
    icon: ClockIcon,
    initialOperator: 'customUpdatedInTheLastDay',
    operators: [{name: 'customUpdatedInTheLastDay', type: 'item'}],
    title: 'Updated in the last day (custom)',
    type: 'customUpdatedLastDay',
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
