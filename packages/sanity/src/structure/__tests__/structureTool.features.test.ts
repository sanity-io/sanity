import {type DocumentInspector, type PluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {createTestSource} from '../../../test/testUtils/createTestSource'
import {
  HISTORY_INSPECTOR_NAME,
  INCOMING_REFERENCES_INSPECTOR_NAME,
  VALIDATION_INSPECTOR_NAME,
} from '../panes/document/constants'
import {structureTool} from '../structureTool'

function Panel() {
  return null
}

const pluginInspector: DocumentInspector = {name: 'plugin/inspector', component: Panel}

const inspectorPlugin: PluginOptions = {
  name: 'inspector-plugin',
  document: {inspectors: [pluginInspector]},
}

describe('structureTool() document features', () => {
  it('keeps the inspector order structureTool and a flat plugin produce today', async () => {
    const source = await createTestSource({plugins: [structureTool(), inspectorPlugin]})

    const {inspectors} = source.document.features({documentId: 'author-1', schemaType: 'author'})
    const flat = source.document.inspectors({documentId: 'author-1', documentType: 'author'})

    expect(inspectors.map((inspector) => inspector.name).slice(0, 4)).toEqual([
      VALIDATION_INSPECTOR_NAME,
      HISTORY_INSPECTOR_NAME,
      INCOMING_REFERENCES_INSPECTOR_NAME,
      'plugin/inspector',
    ])
    expect(inspectors).toEqual(flat)
  })

  it('registers the three structure inspectors once across two structureTool instances', async () => {
    const source = await createTestSource({
      plugins: [structureTool(), structureTool({name: 'second', title: 'Second'})],
    })

    const {inspectors, byName} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })
    const structureInspectors = inspectors.filter((inspector) =>
      inspector.name.startsWith('sanity/structure/'),
    )

    expect(structureInspectors.map((inspector) => inspector.name)).toEqual([
      VALIDATION_INSPECTOR_NAME,
      HISTORY_INSPECTOR_NAME,
      INCOMING_REFERENCES_INSPECTOR_NAME,
    ])
    expect(byName.has('validation')).toBe(true)
    expect(byName.has('history')).toBe(true)
    expect(byName.has('incomingReferences')).toBe(true)
  })
})
