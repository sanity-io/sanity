import {extractManifestSchemaTypes} from '@sanity/schema/_internal'

import {type Workspace} from '../../config/types'

type SchemaSource = Pick<Workspace, 'dataset' | 'name' | 'projectId' | 'schema'>

/** @internal */
export function getSchemaFilename({dataset, name, projectId}: SchemaSource): string {
  return `${[projectId, dataset, name].join('-').replace(/[^\w-]+/g, '-')}.schema.json`
}

/** @internal */
export function downloadSchema(workspace: SchemaSource): void {
  const json = JSON.stringify(extractManifestSchemaTypes(workspace.schema), null, 2)
  const url = URL.createObjectURL(new Blob([json], {type: 'application/json'}))
  const link = Object.assign(document.createElement('a'), {
    download: getSchemaFilename(workspace),
    href: url,
  })
  link.click()
  setTimeout(() => URL.revokeObjectURL(url))
}
