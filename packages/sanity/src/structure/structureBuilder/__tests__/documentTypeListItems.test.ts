import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'

describe('S.documentTypeListItems()', () => {
  it('does not list the system document types that every schema includes', async () => {
    const source = await getMockSource({
      config: {
        schema: {
          name: 'mockSchema',
          types: [{name: 'article', type: 'document', fields: [{name: 'title', type: 'string'}]}],
        },
      },
    })
    const S = createStructureBuilder({source, perspectiveStack: []})
    const ids = S.documentTypeListItems().map((item) => item.getId())

    expect(source.schema.get('system.release')).toBeDefined()
    expect(source.schema.get('system.variant')).toBeDefined()
    expect(ids).toContain('article')
    expect(ids).not.toContain('system.release')
    expect(ids).not.toContain('system.variant')
  })
})
