import {Schema} from '@sanity/schema'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {downloadSchema, getSchemaFilename} from './downloadSchema'

const workspace = {
  dataset: 'production',
  name: 'my workspace',
  projectId: 'abc123',
  schema: Schema.compile({
    name: 'default',
    types: [{fields: [{name: 'title', type: 'string'}], name: 'article', type: 'document'}],
  }),
}

describe('downloadSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('names the file after the workspace target', () => {
    expect(getSchemaFilename(workspace)).toBe('abc123-production-my-workspace.schema.json')
  })

  it('downloads the custom schema types as JSON', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:schema')
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadSchema(workspace)

    expect(click).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0] as Blob
    const types = JSON.parse(await blob.text())
    expect(types.map((type: {name: string}) => type.name)).toEqual(['article'])
  })
})
