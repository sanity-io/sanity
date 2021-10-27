import leven from 'leven'
import {UnresolvedPaneNode} from '../types'
import {defaultStructure} from '../defaultStructure'
import {isRecord} from './isRecord'

const KNOWN_STRUCTURE_EXPORTS = ['getDefaultDocumentNode']

function isStructure(structure: unknown): structure is UnresolvedPaneNode {
  if (typeof structure === 'function') return true
  if (!isRecord(structure)) return false
  return (
    typeof structure.serialize !== 'function' ||
    typeof structure.then !== 'function' ||
    typeof structure.subscribe !== 'function' ||
    typeof structure.type !== 'string'
  )
}

export const loadStructure = (): UnresolvedPaneNode => {
  const mod = require('part:@sanity/desk-tool/structure?') || defaultStructure
  const structure: UnresolvedPaneNode = mod && mod.__esModule ? mod.default : mod

  warnOnUnknownExports(mod)

  if (!isStructure(structure)) {
    throw new Error(
      `Structure needs to export a function, an observable, a promise or a structure builder, got ${typeof structure}`
    )
  }

  return structure
}

function warnOnUnknownExports(mod: Record<string, unknown>) {
  if (!mod) return

  const known = [...KNOWN_STRUCTURE_EXPORTS, 'default']
  const unknownKeys = Object.keys(mod).filter((key) => !known.includes(key))

  for (const key of unknownKeys) {
    const {closest} = known.reduce<{
      closest: string | null
      distance: number
    }>(
      (acc, current) => {
        const distance = leven(current, key)
        return distance < 3 && distance < acc.distance ? {closest: current, distance} : acc
      },
      {closest: null, distance: +Infinity}
    )

    const hint = closest ? ` - did you mean "${closest}"` : ''

    // eslint-disable-next-line
    console.warn(`Unknown structure export "${key}"${hint}`)
  }
}
