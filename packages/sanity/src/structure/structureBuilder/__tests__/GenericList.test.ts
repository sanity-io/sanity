/* this has to be imported after createStructureBuilder due to what looks like a circular import issue */
import {describe, expect, it} from 'vitest'
// oxfmt-ignore
import {createStructureBuilder} from '../createStructureBuilder'
// oxfmt-ignore
import {type SchemaPluginOptions} from 'sanity'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'book',
      title: 'Book',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
}

async function getStructureBuilder() {
  const source = await getMockSource({config: {schema: mockSchema}})
  // @ts-expect-error -- pre-existing, fix later
  return createStructureBuilder({source})
}

describe('GenericListBuilder', () => {
  describe('pane widths', () => {
    it('sets, gets, and serializes list pane width constraints', async () => {
      const S = await getStructureBuilder()
      const builder = S.list()
        .id('content')
        .minWidth(200)
        .currentMaxWidth(250)
        .maxWidth(480)
        .title('Content')

      expect(builder.getMinWidth()).toBe(200)
      expect(builder.getCurrentMaxWidth()).toBe(250)
      expect(builder.getMaxWidth()).toBe(480)
      expect(builder.serialize()).toMatchObject({
        type: 'list',
        minWidth: 200,
        currentMaxWidth: 250,
        maxWidth: 480,
      })
    })

    it('serializes document list pane width constraints', async () => {
      const S = await getStructureBuilder()
      const builder = S.documentTypeList('book').minWidth(240).currentMaxWidth(300).maxWidth(560)

      expect(builder.serialize()).toMatchObject({
        type: 'documentList',
        minWidth: 240,
        currentMaxWidth: 300,
        maxWidth: 560,
      })
    })

    it('serializes document list pane width constraints given as input', async () => {
      const S = await getStructureBuilder()
      const builder = S.documentTypeList({
        schemaType: 'book',
        minWidth: 240,
        currentMaxWidth: 300,
        maxWidth: 560,
      })

      expect(builder.serialize()).toMatchObject({
        type: 'documentList',
        minWidth: 240,
        currentMaxWidth: 300,
        maxWidth: 560,
      })
    })
  })
})
