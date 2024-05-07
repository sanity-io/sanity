import {type Path} from 'sanity'

export interface TreeEditingMenuItem {
  title: string
  path: Path
  children?: TreeEditingMenuItem[]
}
