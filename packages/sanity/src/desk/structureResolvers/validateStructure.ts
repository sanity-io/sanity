import {SerializeError} from '../structureBuilder'
import {UnresolvedPaneNode} from '../types'
import {leven} from './leven'
import {isRecord} from 'sanity'

// TODO: this is not wired up
export function validateStructure(structure: any): UnresolvedPaneNode {
  if (!structure) {
    let val = 'null'

    if (structure !== null) {
      val = typeof structure === 'undefined' ? 'undefined' : 'false'
    }

    throw new SerializeError(`Structure resolved to ${val}`, [], 'root')
  }

  if (!structure.id) {
    throw new SerializeError('Structure did not contain required `id` property', [], 'root')
  }

  if (structure.id === 'edit') {
    throw new SerializeError('The root structure cannot have value `edit` as `id`', [], 'root')
  }

  warnOnUnknownExports(structure as any)

  if (!isStructure(structure)) {
    throw new Error(
      `Structure needs to export a function, an observable, a promise or a structure builder, got ${typeof structure}`
    )
  }

  return structure
}

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

// export const validateStructure = (structure: any):  => {

// }

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
