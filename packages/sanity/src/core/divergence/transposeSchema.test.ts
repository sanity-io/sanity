import {defineArrayMember, defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {firstValueFrom} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createPrepareFormState,
  type PrepareFormState,
  type RootFormStateOptions,
} from '../form/store/formState'
import {createSchema} from '../schema/createSchema'
import {type Divergence} from './readDocumentDivergences'
import {transposeSchema} from './transposeSchema'

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'person',
      type: 'document',
      fields: [defineField({name: 'name', type: 'string'})],
    }),
    defineType({
      name: 'article',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({name: 'subtitle', type: 'string'}),
        defineField({
          name: 'author',
          type: 'reference',
          to: [{type: 'person'}],
        }),
        defineField({name: 'cover', type: 'image'}),
        defineField({name: 'slug', type: 'slug'}),
        defineField({
          name: 'seo',
          type: 'object',
          fields: [defineField({name: 'description', type: 'string'})],
        }),
        defineField({
          name: 'tags',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          options: {layout: 'tags'},
        }),
        defineField({
          name: 'palette',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
          options: {list: ['red', 'blue']},
        }),
        defineField({
          name: 'colors',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
        }),
      ],
    }),
  ],
})

const schemaType = schema.get('article') as ObjectSchemaType

const documentValue = {
  _id: 'drafts.article',
  _type: 'article',
  _rev: 'rev1',
  title: 'Title',
  subtitle: 'Subtitle',
  author: {_type: 'reference', _ref: 'person-1'},
  cover: {
    _type: 'image',
    asset: {_type: 'reference', _ref: 'image-1'},
  },
  slug: {current: 'title'},
  seo: {description: 'Desc'},
  tags: ['alpha'],
  palette: ['red'],
  colors: ['oklch(0.7 0.2 40)'],
}

const formStateOptions: Omit<
  RootFormStateOptions,
  'schemaType' | 'documentValue' | 'comparisonValue'
> = {
  currentUser: {
    email: 'ada@sanity.io',
    id: 'x',
    name: 'Ada',
    roles: [],
  },
  focusPath: [],
  openPath: [],
  presence: [],
  validation: [],
  changesOpen: false,
  collapsedFieldSets: undefined,
  collapsedPaths: undefined,
  fieldGroupState: undefined,
  hidden: undefined,
  readOnly: undefined,
  perspective: 'drafts',
  hasUpstreamVersion: true,
  baseVariantValue: undefined,
  hasBaseVariant: false,
}

function unresolved(
  path: string,
  extra?: {
    status?: Divergence['status']
    snapshots?: Divergence['snapshots']
  },
): Divergence {
  return {
    path,
    effect: 'set',
    isAddressable: true,
    documentId: 'article',
    subjectId: 'drafts.article',
    sinceRevisionId: 'article@rev1',
    status: extra?.status ?? 'unresolved',
    documentType: 'article',
    snapshots: extra?.snapshots ?? {
      subjectHead: undefined,
      upstreamHead: undefined,
      upstreamAtFork: undefined,
    },
  }
}

describe('transposeSchema', () => {
  let prepareFormState: PrepareFormState

  beforeEach(() => {
    prepareFormState = createPrepareFormState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function transpose(divergences: Record<string, Divergence>) {
    const formState = prepareFormState({
      ...formStateOptions,
      schemaType,
      documentValue,
      comparisonValue: documentValue,
    })

    if (formState === null) {
      throw new Error('Expected form state')
    }

    return firstValueFrom(
      transposeSchema(divergences, schemaType, {
        groups: formState.groups,
        _allMembers: formState._allMembers,
      }),
    )
  }

  it('emits nothing when no form path has a divergence', async () => {
    const result = await transpose({})

    expect(result.divergences).toEqual([])
    expect(result.divergencesByNode).toEqual({})
  })

  it('emits a leaf for an unresolved string field', async () => {
    const title = unresolved('title')
    const result = await transpose({title})

    expect(result.divergences).toEqual([
      [
        'title',
        expect.objectContaining({
          isComposite: false,
          path: 'title',
          schemaType: expect.objectContaining({jsonType: 'string'}),
          divergences: [['title', title]],
        }),
      ],
    ])
    expect(result.divergencesByNode).toEqual({title: 1})
    expect(result.divergences[0][1].diffComponent).toBeDefined()
  })

  it('omits resolved divergences and keeps unresolved siblings', async () => {
    const result = await transpose({
      title: unresolved('title', {status: 'resolved'}),
      subtitle: unresolved('subtitle'),
    })

    expect(result.divergences.map(([path]) => path)).toEqual(['subtitle'])
  })

  it('omits divergences that do not match a form member path', async () => {
    const result = await transpose({
      notInTheForm: unresolved('notInTheForm'),
    })

    expect(result.divergences).toEqual([])
  })

  it('drops a form-path divergence whose snapshot path is missing from the schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await transpose({
      title: unresolved('title', {
        snapshots: {
          subjectHead: {
            pathWithTypes: [{segment: 'doesNotExist', type: 'string'}],
            value: 'Title',
          },
          upstreamHead: undefined,
          upstreamAtFork: undefined,
        },
      }),
    })

    expect(result.divergences).toEqual([])
    expect(warn).toHaveBeenCalled()
  })

  it('groups a reference field as a composite node', async () => {
    const author = unresolved('author')
    const result = await transpose({author})

    expect(result.divergences).toEqual([
      [
        'author',
        expect.objectContaining({
          isComposite: true,
          path: 'author',
          schemaType: expect.objectContaining({name: 'reference'}),
          divergences: [['author', author]],
        }),
      ],
    ])
    expect(result.divergences[0][1].diffComponent).toBeDefined()
  })

  it('groups an image field as a composite node', async () => {
    const cover = unresolved('cover')
    const result = await transpose({cover})

    expect(
      result.divergences.map(([path, node]) => [path, node.isComposite, node.schemaType.name]),
    ).toEqual([['cover', true, 'image']])
    expect(result.divergences[0][1].divergences).toEqual([['cover', cover]])
  })

  it('groups a slug field as a composite node', async () => {
    const slug = unresolved('slug')
    const result = await transpose({slug})

    expect(
      result.divergences.map(([path, node]) => [path, node.isComposite, node.schemaType.name]),
    ).toEqual([['slug', true, 'slug']])
  })

  it('keeps nested object fields as leaves when the parent has no dedicated diff component', async () => {
    const description = unresolved('seo.description')
    const result = await transpose({'seo.description': description})

    expect(result.divergences.map(([path, node]) => [path, node.isComposite])).toEqual([
      ['seo.description', false],
    ])
    expect(result.divergencesByNode).toEqual({
      'seo': 1,
      'seo.description': 1,
    })
  })

  it('omits items of a tags array while keeping the array field itself', async () => {
    const result = await transpose({
      'tags': unresolved('tags'),
      'tags[0]': unresolved('tags[0]'),
    })

    expect(result.divergences.map(([path]) => path)).toEqual(['tags'])
  })

  it('omits items of a primitive array that uses list options while keeping the array field', async () => {
    const result = await transpose({
      'palette': unresolved('palette'),
      'palette[0]': unresolved('palette[0]'),
    })

    expect(result.divergences.map(([path]) => path)).toEqual(['palette'])
  })

  it('keeps items of a plain primitive array', async () => {
    const color = unresolved('colors[0]')
    const result = await transpose({'colors[0]': color})

    expect(result.divergences.map(([path, node]) => [path, node.isComposite])).toEqual([
      ['colors[0]', false],
    ])
    expect(result.divergencesByNode).toEqual({
      'colors': 1,
      'colors[0]': 1,
    })
  })

  it('emits reachable divergences in form order', async () => {
    const result = await transpose({
      'subtitle': unresolved('subtitle'),
      'title': unresolved('title'),
      'seo.description': unresolved('seo.description'),
    })

    expect(result.divergences.map(([path]) => path)).toEqual([
      'title',
      'subtitle',
      'seo.description',
    ])
  })
})
