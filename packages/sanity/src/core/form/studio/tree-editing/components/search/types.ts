import {type BreadcrumbItem} from '../../types'

export interface SearchableTreeEditingMenuItem extends BreadcrumbItem {
  title: string | undefined
  children?: SearchableTreeEditingMenuItem[]
}
