import {describe, expect, it} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'

describe('default document type list menu groups', () => {
  it('gives each group the heading that matches what it holds', async () => {
    const source = await getMockSource({
      config: {
        schema: {
          name: 'mockSchema',
          types: [
            {
              name: 'article',
              title: 'Article',
              type: 'document',
              fields: [{name: 'title', type: 'string'}],
            },
          ],
        },
      },
    })
    const S = createStructureBuilder({source, perspectiveStack: []})

    const groups = S.documentTypeList('article').getMenuItemGroups() ?? []
    const headingKeyById = Object.fromEntries(
      groups.map((group) => {
        // A group can also be a builder, whose `i18n` is a setter: plain groups carry the record
        const i18n = typeof group.i18n === 'function' ? undefined : group.i18n
        return [group.id, i18n?.title?.key]
      }),
    )

    expect(headingKeyById).toEqual({
      sorting: 'menu-item-groups.sorting-group',
      layout: 'menu-item-groups.layout-group',
      actions: 'menu-item-groups.actions-group',
    })
  })
})
