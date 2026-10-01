import {describe, expect, it} from 'vitest'

import {createTestSource} from '../../../test/testUtils/createTestSource'
import {type Source} from '../../core/config/types'
import {openInStructure} from '../fieldActions/openInStructure'
import {presentationTool} from '../plugin'

function resolveFieldActions(source: Source) {
  const schemaType = source.schema.get('author')
  if (!schemaType) throw new Error('Expected the author schema type to resolve')

  return source.document.unstable_fieldActions({
    documentId: 'author-1',
    documentType: 'author',
    schemaType,
  })
}

describe('presentationTool() document features', () => {
  it('registers the open-in-structure field action under the name `openInStructure`', async () => {
    const source = await createTestSource({
      plugins: [presentationTool({previewUrl: 'https://example.com'})],
    })

    const {fieldActions, byName} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })

    expect(resolveFieldActions(source)).toContain(openInStructure)
    expect(fieldActions).toEqual(resolveFieldActions(source))
    expect(byName.get('openInStructure')).toEqual({
      name: 'openInStructure',
      fieldAction: openInStructure,
    })
  })

  it('registers it once across two presentationTool instances', async () => {
    const source = await createTestSource({
      plugins: [
        presentationTool({previewUrl: 'https://example.com'}),
        presentationTool({name: 'second', previewUrl: 'https://example.com/second'}),
      ],
    })

    const {fieldActions} = source.document.features({
      documentId: 'author-1',
      schemaType: 'author',
    })

    expect(fieldActions.filter((action) => action === openInStructure)).toHaveLength(1)
    expect(resolveFieldActions(source).filter((action) => action === openInStructure)).toHaveLength(
      1,
    )
  })
})
