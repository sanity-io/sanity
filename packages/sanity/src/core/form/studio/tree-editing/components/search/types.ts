import {type TreeEditingMenuItem} from '../../types'

export interface SearchableTreeEditingMenuItem extends TreeEditingMenuItem {
  title: string | undefined
  children?: SearchableTreeEditingMenuItem[]
}
