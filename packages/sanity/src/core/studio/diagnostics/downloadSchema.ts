import {extractManifestSchemaTypes} from '@sanity/schema/_internal'

import {type Workspace} from '../../config/types'

type SchemaSource = Pick<Workspace, 'dataset' | 'name' | 'projectId' | 'schema'>

/** @internal */
export function getSchemaFilename(
  {dataset, name, projectId}: SchemaSource,
  format: 'manifest' | 'raw' = 'manifest',
): string {
  const base = [projectId, dataset, name].join('-').replace(/[^\w-]+/g, '-')
  return format === 'raw' ? `${base}.schema.raw.json` : `${base}.schema.json`
}

/** @internal */
export function downloadSchema(workspace: SchemaSource): void {
  const {format, json} = serializeSchema(workspace)
  const url = URL.createObjectURL(new Blob([json], {type: 'application/json'}))
  const link = Object.assign(document.createElement('a'), {
    download: getSchemaFilename(workspace, format),
    href: url,
  })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url))
}

function serializeSchema({schema}: SchemaSource): {format: 'manifest' | 'raw'; json: string} {
  try {
    return {format: 'manifest', json: JSON.stringify(extractManifestSchemaTypes(schema), null, 2)}
  } catch {
    return {format: 'raw', json: JSON.stringify(schema._original?.types ?? [], rawReplacer(), 2)}
  }
}

function rawReplacer() {
  const ancestors: unknown[] = []
  return function replace(this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`
    if (typeof value !== 'object' || value === null) return value
    if ('$$typeof' in value) return '[React element]'
    while (ancestors.length > 0 && ancestors.at(-1) !== this) ancestors.pop()
    if (ancestors.includes(value)) return '[Circular]'
    ancestors.push(value)
    return value
  }
}
