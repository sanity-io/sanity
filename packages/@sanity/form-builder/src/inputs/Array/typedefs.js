// @flow
import type {Type} from '../../typedefs'

export type ArrayType = Type & {
  name: string,
  title: string,
  description: string,
  readOnly: ?boolean,
  options: {
    editModal: 'fold' | 'modal',
    sortable: boolean,
    layout?: 'grid'
  },
  of: Array<Type>
}

export type ItemValue = {
  _type?: string,
  _key: string
}
