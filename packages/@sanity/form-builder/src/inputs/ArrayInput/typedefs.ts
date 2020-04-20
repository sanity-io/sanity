import {Type} from '../../typedefs'

export type ModalType = 'modal' | 'fullscreen' | string

export type ArrayType = Type & {
  name: string
  title: string
  description: string
  readOnly: boolean | null
  options: {
    editModal?: ModalType
    sortable?: boolean
    layout?: 'grid'
  }
  of: Array<Type>
}

export type ItemValue = {
  _type?: string
  _key: string
  [key: string]: any
}
