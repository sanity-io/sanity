import {parse} from '../parser/parse'
import {type Path} from '../types'

export function normalize(path: string | Readonly<Path>): Readonly<Path> {
  return typeof path === 'string' ? parse(path) : path
}
