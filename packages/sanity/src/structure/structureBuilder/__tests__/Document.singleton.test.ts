import {type SchemaPluginOptions} from 'sanity'
import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {SerializeError} from '../SerializeError'
import {type StructureBuilder} from '../types'

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'settings',
      title: 'Settings',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
    {
      name: 'article',
      title: 'Article',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
}

async function createBuilder(schema: SchemaPluginOptions = mockSchema): Promise<StructureBuilder> {
  const source = await getMockSource({
    config: {
      schema,
      document: {
        singletons: [
          {id: 'settingsSingleton', documentId: 'settingsDocument', schemaType: 'settings'},
        ],
      },
    },
  })
  return createStructureBuilder({source, perspectiveStack: []})
}

describe('DocumentBuilder.singleton()', () => {
  it('sets schemaType, documentId, and the tagged singleton template from the registry', async () => {
    const S = await createBuilder()
    const node = S.document().singleton('settingsSingleton').serialize()
    expect(node.options.id).toBe('settingsDocument')
    expect(node.options.type).toBe('settings')
    expect(node.options.template).toBe('settingsSingleton')
  })

  it('pins a replacement template as long as its `singleton` tag is preserved', async () => {
    const S = await createBuilder({
      ...mockSchema,
      // Matched by template id (equal to the definition id) — the authoring
      // `Template` type doesn't expose the `singleton` tag, but the spread
      // preserves it at runtime.
      templates: (previous) =>
        previous.map((template) =>
          template.id === 'settingsSingleton'
            ? {...template, id: 'custom-settings-template'}
            : template,
        ),
    })
    const node = S.document().singleton('settingsSingleton').serialize()
    expect(node.options.template).toBe('custom-settings-template')
  })

  it('throws immediately when given an unknown singleton definition id', async () => {
    const S = await createBuilder()
    expect(() => S.document().singleton('typo')).toThrow(SerializeError)
    expect(() => S.document().singleton('typo')).toThrow(
      /No singleton with id "typo" found\. Did you add it to `document\.singletons`\?/,
    )
  })

  it('lets a subsequent .documentId() override the singleton default', async () => {
    const S = await createBuilder()
    const node = S.document().singleton('settingsSingleton').documentId('override').serialize()
    expect(node.options.id).toBe('override')
    expect(node.options.type).toBe('settings')
  })

  it('lets a subsequent .schemaType() override the singleton default', async () => {
    const S = await createBuilder()
    const node = S.document().singleton('settingsSingleton').schemaType('article').serialize()
    expect(node.options.id).toBe('settingsDocument')
    expect(node.options.type).toBe('article')
  })

  it('lets a subsequent .initialValueTemplate() override the pinned template', async () => {
    const S = await createBuilder()
    const node = S.document()
      .singleton('settingsSingleton')
      .initialValueTemplate('custom-template')
      .serialize()
    expect(node.options.template).toBe('custom-template')
  })

  it('does not pin a template when the tagged singleton template has been removed', async () => {
    const S = await createBuilder({
      ...mockSchema,
      templates: (previous) => previous.filter((template) => template.id !== 'settingsSingleton'),
    })
    const node = S.document().singleton('settingsSingleton').serialize()
    expect(node.options.id).toBe('settingsDocument')
    expect(node.options.type).toBe('settings')
    expect(node.options.template).toBeUndefined()
  })
})
