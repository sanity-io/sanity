import {Schema} from '@sanity/schema'
import type * as SchemaInternal from '@sanity/schema/_internal'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {downloadSchema, getSchemaFilename} from './downloadSchema'

const mocks = vi.hoisted(() => ({extractFails: false}))

vi.mock('@sanity/schema/_internal', async (importOriginal) => {
  const actual = await importOriginal<typeof SchemaInternal>()
  return {
    ...actual,
    extractManifestSchemaTypes: (...args: Parameters<typeof actual.extractManifestSchemaTypes>) => {
      if (mocks.extractFails) throw new Error('Unsupported type')
      return actual.extractManifestSchemaTypes(...args)
    },
  }
})

const titleField = {name: 'title', type: 'string'}
const circularOptions: Record<string, unknown> = {layout: 'grid'}
circularOptions.self = circularOptions

const workspace = {
  dataset: 'production',
  name: 'my workspace',
  projectId: 'abc123',
  schema: Schema.compile({
    name: 'default',
    types: [
      {
        fields: [titleField, {name: 'tags', options: circularOptions, type: 'string'}],
        icon: <span />,
        name: 'article',
        type: 'document',
        validation: function required() {
          return undefined
        },
      },
      {fields: [titleField], name: 'author', type: 'document'},
    ],
  }),
}

async function captureDownload() {
  const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:schema')
  let filename = ''
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
    this: HTMLAnchorElement,
  ) {
    filename = this.download
  })

  downloadSchema(workspace)

  const blob = createObjectURL.mock.calls[0][0] as Blob
  return {filename, json: JSON.parse(await blob.text())}
}

describe('downloadSchema', () => {
  afterEach(() => {
    mocks.extractFails = false
    vi.restoreAllMocks()
  })

  it('names the file after the workspace target', () => {
    expect(getSchemaFilename(workspace)).toBe('abc123-production-my-workspace.schema.json')
    expect(getSchemaFilename(workspace, 'raw')).toBe(
      'abc123-production-my-workspace.schema.raw.json',
    )
  })

  it('downloads the custom schema types as manifest JSON', async () => {
    const {filename, json} = await captureDownload()

    expect(filename).toBe('abc123-production-my-workspace.schema.json')
    expect(json.map((type: {name: string}) => type.name)).toEqual(['article', 'author'])
  })

  it('falls back to the raw definitions when the manifest cannot be extracted', async () => {
    mocks.extractFails = true

    const {filename, json} = await captureDownload()

    expect(filename).toBe('abc123-production-my-workspace.schema.raw.json')
    const [article, author] = json
    expect(article.icon).toBe('[React element]')
    expect(article.validation).toBe('[Function required]')
    expect(article.fields[1].options).toEqual({layout: 'grid', self: '[Circular]'})
    expect(article.fields[0]).toEqual(titleField)
    expect(author.fields[0]).toEqual(titleField)
  })
})
