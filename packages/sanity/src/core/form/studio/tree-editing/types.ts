import {type Path} from 'sanity'

export interface TreeEditingMenuItem {
  title: string
  path: Path
  children?: TreeEditingMenuItem[]
}

export interface TreeEditingBreadcrumb {
  title: string
  path: Path
  children: TreeEditingBreadcrumb[]
  parentArrayTitle: string
}
