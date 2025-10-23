import {type DialogItem} from '../../types'

export interface SearchableTreeEditingMenuItem extends DialogItem {
  title: string | undefined
  children?: SearchableTreeEditingMenuItem[]
}
