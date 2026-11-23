import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'

describe('documentTypeListItems', () => {
  it('leaves the release and variant document types out of the default lists', async () => {
    const source = await getMockSource({config: {beta: {variants: {enabled: true}}}})
    expect(source.schema.get('system.release')).toBeDefined()
    expect(source.schema.get('system.variant')).toBeDefined()

    const S = createStructureBuilder({source, perspectiveStack: []})
    const ids = S.documentTypeListItems().map((item) => item.getId())

    expect(ids).toContain('author')
    expect(ids).not.toContain('system.release')
    expect(ids).not.toContain('system.variant')
  })
})
