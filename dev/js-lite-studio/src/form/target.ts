/**
 * Where an input writes: a path in the document, plus the objects above it that have to exist
 * first (each written with `setIfMissing` when it is missing, like the JS form builder does).
 */
import {getAt, type Path, type PathSegment, pathToString} from '../paths'
import * as store from '../store'
import {type Json, type JsonObject} from '../util'

export interface Target {
  published: string
  typeName: string
  /** The release whose version the form edits, none for the draft. */
  release: string | undefined
  doc: JsonObject | null | undefined
  readOnly: boolean
  path: Path
  ensure: [Path, JsonObject][]
}

export function rootTarget(
  published: string,
  typeName: string,
  release: string | undefined,
  doc: JsonObject | null | undefined,
  readOnly: boolean,
): Target {
  return {published, typeName, release, doc, readOnly, path: [], ensure: []}
}

export function valueOf(target: Target): unknown {
  return target.path.length === 0 ? target.doc : getAt(target.doc, target.path)
}

export function child(target: Target, segment: PathSegment): Target {
  return {...target, path: [...target.path, segment]}
}

/** A field of the object at this path, which gets created as `{_type}` (or `{}` for anonymous
 * objects) before the field is written. */
export function objectField(target: Target, objectType: string, field: string): Target {
  const ensure = [...target.ensure]
  if (target.path.length > 0) {
    ensure.push([target.path, objectType === 'object' ? {} : {_type: objectType}])
  }
  return {...target, path: [...target.path, field], ensure}
}

export const op = {
  set: (path: Path, value: Json): JsonObject => ({set: {[pathToString(path)]: value}}),
  setIfMissing: (path: Path, value: Json): JsonObject => ({
    setIfMissing: {[pathToString(path)]: value},
  }),
  unset: (path: Path): JsonObject => ({unset: [pathToString(path)]}),
  insert: (position: 'before' | 'after', path: Path, items: Json[]): JsonObject => ({
    insert: {[position]: pathToString(path), items},
  }),
}

export function patch(target: Target, ops: JsonObject[]): void {
  // A stale `doc` only costs a `setIfMissing` that changes nothing.
  const missing = target.ensure.filter(([path]) => getAt(target.doc, path) === undefined)
  store.edit(target.published, target.typeName, target.release, [
    ...missing.map(([path, initial]) => op.setIfMissing(path, initial)),
    ...ops,
  ])
}

export function setValue(target: Target, value: Json): void {
  patch(target, [op.set(target.path, value)])
}

export function unsetValue(target: Target): void {
  patch(target, [op.unset(target.path)])
}
