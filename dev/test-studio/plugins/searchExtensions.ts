import {
  definePlugin,
  defineSearchFilterOperators,
  defineSearchOperator,
  type SearchOperatorType,
} from 'sanity'

type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key]
}

const operators = [
  defineSearchOperator({
    buttonLabel: 'contains custom',
    type: 'containsCustom',
    label: 'Contains custom',
    fn: ({fieldPath}) => `${fieldPath} match 'custom'`,
  }),
] as const

type OperatorExtensions = Mutable<typeof operators>
type OperatorExtensionType = OperatorExtensions[number]['type']

export const searchExtensions = definePlugin({
  name: 'search-extensions',
  search: {
    operators: operators as OperatorExtensions,
    filters: (prev, context) => {
      if (!context.currentUser?.roles.some((r) => r.name === 'administrator')) {
        return prev
      }
      return prev.map((filter) => {
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
