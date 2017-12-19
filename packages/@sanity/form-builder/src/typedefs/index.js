import {Path} from './path'

export type Type = {
  type: Type,
  name: string,
  title: string,
  options: ?Object
}

export type Reference = {
  _type: string,
  _ref?: string
}

export type Marker = {
  path: Path,
  type: string,
  level?: string,
  item: any
}
