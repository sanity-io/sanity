import {Path} from './path'

export type Type = {
  type: Type
  name: string
  title: string
  options: Record<string, any> | null
  [prop: string]: any
}

export type Reference = {
  _type: string
  _ref?: string
  _weak?: true
}

export type Marker = {
  path: Path
  type: string
  level?: string
  item: any
}

export type FormBuilderPresence = {
  sessionId: string
  userId: string
  path: Path
  timestamp: string
  state: {[key: string]: any}
}
