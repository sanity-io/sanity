import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType} from '@sanity/types'
import {useToast} from '@sanity/ui'
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type FIXME} from '../../../FIXME'
import {PatchEvent} from '../../../form/patch/PatchEvent'
import {useCopyPaste} from '../CopyPasteProvider'
import {type SanityClipboardItem} from '../types'
import {getClipboardItem} from '../utils'
import {createMockClient} from './mockClient'
import {mockTypes, schema} from './schema'
import {setupClipboard, writeItemsToClipboard} from './viClipboard'

vi.mock('@sanity/ui', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('@sanity/ui')>('@sanity/ui')
  return {
    ...actual,
    useToast: vi.fn(),
  }
})

const MIMETYPE_SANITY_CLIPBOARD = 'web application/vnd.sanity-clipboard-item+json'

const createMockClipboardItem = (mockClipboardItem: SanityClipboardItem) => {
  return {
    types: [MIMETYPE_SANITY_CLIPBOARD],
    getType: async () =>
      new Blob([JSON.stringify(mockClipboardItem)], {type: MIMETYPE_SANITY_CLIPBOARD}),
  } as unknown as ClipboardItem
}

const setupMockClipboardRead = async (mockClipboardItem: SanityClipboardItem) => {
  setupClipboard()

  await writeItemsToClipboard([createMockClipboardItem(mockClipboardItem)])
}

let mockClient: SanityClient

describe('useCopyPaste', () => {
  const mockToast = {push: vi.fn(), version: 0 as const}
  const mockOnChange = vi.fn()

  beforeEach(() => {
    ;(useToast as ReturnType<typeof vi.fn>).mockReturnValue(mockToast)

    mockClient = createMockClient([
      {_id: 'doc1', _type: 'author', name: 'John Doe'},
      {_id: 'editor1', _type: 'editor', name: 'John Doe'},
      {_id: 'image1', _type: 'sanity.imageAsset', mimeType: 'image/jpeg'},
      {_id: 'file1', _type: 'sanity.fileAsset', mimeType: 'application/pdf'},
    ]) as FIXME as SanityClient

    vi.clearAllMocks()
  })

  const setupUseCopyPaste = async () => {
    const TestWrapper = await createTestProvider({
      client: mockClient,
      config: {
        name: 'default',
        projectId: 'test',
        dataset: 'test',
        schema: {
          types: mockTypes,
        },
      },
    })

    const {result} = renderHook(() => useCopyPaste(), {wrapper: TestWrapper})

    await act(async () => {
      await expect(result.current).toBeDefined()
      await expect(result.current).not.toBeNull()
    })

    return result
  }

  it('should handle pasting correctly', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'string',
      valuePath: ['name'],
      value: 'Test Author',
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() =>
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'author',
        schemaType: schema.get('author')! as ObjectSchemaType,
        onChange: mockOnChange,
      }),
    )

    await act(async () => {
      await result.current.onPaste(
        ['name'],
        {_type: 'author', _id: 'doc1', name: 'Test Author'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(expect.any(PatchEvent))
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          {patchType: expect.any(Symbol), path: ['name'], type: 'set', value: 'Test Author'},
        ],
      }),
    )
  })

  it('should validate references when pasting', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc2',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'reference',
      valuePath: ['bestFriend'],
      value: {_type: 'reference', _ref: 'doc-non-existing'},
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'ref2',
        documentType: 'referencesDocument',
        schemaType: schema.get('referencesDocument')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['reference'],
        {
          _type: 'referencesDocument',
          _id: 'ref2',
        },
        {
          context: {source: 'fieldAction'},
        },
      )
    })
    expect(mockToast.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        description: 'The referenced document "doc-non-existing" does not exist',
      }),
    )

    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('should handle pasting documents of the same type', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: true,
      schemaTypeName: 'author',
      valuePath: [],
      value: {_type: 'author', _id: 'doc1', name: 'Knut'},
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc2',
        documentType: 'author',
        schemaType: schema.get('author')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        [],
        {_type: 'author', _id: 'doc2'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            value: expect.objectContaining({_type: 'author', name: 'Knut'}),
          }),
        ],
      }),
    )
  })

  it('should handle pasting arrays', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'array',
      valuePath: ['favoriteNumbers'],
      value: [1, 2, 3],
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['favoriteNumbers'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['favoriteNumbers'],
            value: [],
          }),
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['favoriteNumbers'],
            value: [1, 2, 3],
          }),
        ],
      }),
    )
  })

  it('should handle pasting objects', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'object',
      valuePath: ['profile'],
      value: {_type: 'profile', isFavorite: false},
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc2',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['profile'],
        {_type: 'editor', _id: 'doc2'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['profile'],
            value: {_type: 'object', isFavorite: false},
          }),
        ],
      }),
    )
  })

  it('should handle pasting image objects', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'image',
      valuePath: ['profileImage'],
      value: {
        _type: 'image',
        asset: {
          _ref: 'image1',
          _type: 'reference',
        },
      },
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'author',
        schemaType: schema.get('author')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['profileImage'],
        {_type: 'author', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['profileImage'],
            value: {
              _type: 'image',
              asset: {
                _ref: 'image1',
                _type: 'reference',
              },
            },
          }),
        ],
      }),
    )
  })

  it('should validate image objects when pasting', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'image',
      valuePath: ['profileImage'],
      value: {
        _type: 'image',
        asset: {
          _ref: 'image1',
          _type: 'reference',
        },
      },
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['profileImagePNG'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockToast.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        title: expect.stringContaining('Invalid clipboard item'),
        description: expect.stringContaining(`is not accepted for this field`),
      }),
    )
  })

  it('should handle pasting weak references into hard references', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'reference',
      valuePath: ['bestFriend'],
      value: {
        _type: 'reference',
        _ref: 'doc1',
        _weak: true,
      },
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['bestAuthorFriend'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['bestAuthorFriend'],
            value: {
              _type: 'reference',
              _ref: 'doc1',
            },
          }),
        ],
      }),
    )
  })

  it('should handle pasting hard references into weak references', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'reference',
      valuePath: ['bestAuthorFriend'],
      value: {
        _type: 'reference',
        _ref: 'doc1',
      },
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'author',
        schemaType: schema.get('author')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['bestFriend'],
        {_type: 'author', _id: 'doc3'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['bestFriend'],
            value: {
              _type: 'reference',
              _ref: 'doc1',
              _weak: true,
            },
          }),
        ],
      }),
    )
  })

  it('should handle pasting arrays of references', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'referencesDocument',
      isDocument: false,
      schemaTypeName: 'array',
      valuePath: ['arrayOfReferences'],
      value: [
        {
          _type: 'reference',
          _ref: 'editor1',
          _key: '123',
        },
      ],
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'referencesDocument',
        schemaType: schema.get('referencesDocument')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['arrayOfReferences'],
        {_type: 'referencesDocument', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['arrayOfReferences'],
            value: [],
          }),
          expect.objectContaining({
            type: 'set',
            patchType: expect.any(Symbol),
            path: ['arrayOfReferences'],
            value: [
              expect.objectContaining({
                _type: 'reference',
                _ref: 'editor1',
                _key: expect.any(String),
              }),
            ],
          }),
        ],
      }),
    )
  })

  it('should handle appending a single array item into another array', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'referencesDocument',
      isDocument: false,
      schemaTypeName: 'array',
      valuePath: ['arrayOfReferences'],
      value: [
        {
          _type: 'reference',
          _ref: 'editor1',
          _key: '123',
        },
      ],
      patchType: 'append',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'referencesDocument',
        schemaType: schema.get('referencesDocument')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['arrayOfReferences'],
        {
          _type: 'referencesDocument',
          _id: 'doc1',
        },
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['arrayOfReferences'],
            value: [],
          }),
          expect.objectContaining({
            type: 'insert',
            patchType: expect.any(Symbol),
            path: ['arrayOfReferences[-1]'],
            position: 'after',
            items: [
              expect.objectContaining({
                _type: 'reference',
                _ref: 'editor1',
                _key: expect.any(String),
              }),
            ],
          }),
        ],
      }),
    )
  })

  it('should handle appending a single empty ref array item into another array', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'referencesDocument',
      isDocument: false,
      schemaTypeName: 'reference',
      valuePath: ['arrayOfReferences'],
      value: [
        {
          _type: 'reference',
          _key: '123',
        },
      ],
      patchType: 'append',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'referencesDocument',
        schemaType: schema.get('referencesDocument')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['arrayOfReferences'],
        {
          _type: 'referencesDocument',
          _id: 'doc1',
        },
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['arrayOfReferences'],
            value: [],
          }),
          expect.objectContaining({
            type: 'insert',
            patchType: expect.any(Symbol),
            path: ['arrayOfReferences[-1]'],
            position: 'after',
            items: [
              expect.objectContaining({
                _type: 'reference',
                _key: expect.any(String),
              }),
            ],
          }),
        ],
      }),
    )
  })

  it('should handle copying a object into an array', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'object',
      valuePath: ['profile'],
      value: {
        _type: 'color',
        title: 'Red',
        name: 'red',
        _key: 'auto-generated-0',
      },
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['arrayOfPredefinedOptions'],
        {
          _type: 'editor',
          _id: 'doc1',
        },
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['arrayOfPredefinedOptions'],
            value: [],
          }),
          expect.objectContaining({
            type: 'insert',
            patchType: expect.any(Symbol),
            path: ['arrayOfPredefinedOptions[-1]'],
            position: 'after',
            items: [
              expect.objectContaining({
                _type: 'color',
                _key: expect.any(String),
                name: 'red',
                title: 'Red',
              }),
            ],
          }),
        ],
      }),
    )
  })

  it('should handle pasting primitive values into arrays', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'number',
      valuePath: ['born'],
      value: 1984,
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['favoriteNumbers'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['favoriteNumbers'],
            value: [],
          }),
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'insert',
            path: ['favoriteNumbers[-1]'],
            items: [1984],
          }),
        ],
      }),
    )
  })

  it('should handle pasting a single primitive number array value into arrays', async () => {
    const result = await setupUseCopyPaste()
    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'number',
      valuePath: ['favoriteNumbers', 0],
      value: [1984],
      patchType: 'append',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['favoriteNumbers'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['favoriteNumbers'],
            value: [],
          }),
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'insert',
            path: ['favoriteNumbers[-1]'],
            items: [1984],
          }),
        ],
      }),
    )
  })

  it('should handle copying a single primitive string array value from arrays', async () => {
    const result = await setupUseCopyPaste()
    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'string',
      valuePath: ['favoriteStrings', 0],
      // This should automatically be wrapped in an array
      value: 'Favourite string',
      patchType: 'append',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onCopy(
        ['favoriteStrings', 0],
        {_type: 'editor', _id: 'doc1', favoriteStrings: ['Favourite string']},
        {
          context: {source: 'arrayItem'},
        },
      )
    })

    expect(await getClipboardItem()).toEqual({
      patchType: 'append',
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'string',
      value: 'Favourite string',
      valuePath: ['favoriteStrings', 0],
    })
  })

  it('should handle pasting a single primitive string array value into arrays', async () => {
    const result = await setupUseCopyPaste()
    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'editor',
      isDocument: false,
      schemaTypeName: 'string',
      valuePath: ['favoriteStrings', 0],
      // This should automatically be wrapped in an array
      value: 'Favourite string',
      patchType: 'append',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['favoriteStrings'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        patches: [
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'setIfMissing',
            path: ['favoriteStrings'],
            value: [],
          }),
          expect.objectContaining({
            patchType: expect.any(Symbol),
            type: 'insert',
            path: ['favoriteStrings[-1]'],
            items: ['Favourite string'],
          }),
        ],
      }),
    )
  })

  it('should handle pasting between incompatible types', async () => {
    const result = await setupUseCopyPaste()

    const mockClipboardItem: SanityClipboardItem = {
      type: 'sanityClipboardItem',
      documentId: 'doc1',
      documentType: 'author',
      isDocument: false,
      schemaTypeName: 'string',
      valuePath: ['name'],
      value: 'John Doe',
      patchType: 'replace',
    }

    await setupMockClipboardRead(mockClipboardItem)

    act(() => {
      result.current.setDocumentMeta({
        documentId: 'doc1',
        documentType: 'editor',
        schemaType: schema.get('editor')! as ObjectSchemaType,
        onChange: mockOnChange,
      })
    })

    await act(async () => {
      await result.current.onPaste(
        ['born'],
        {_type: 'editor', _id: 'doc1'},
        {
          context: {source: 'fieldAction'},
        },
      )
    })

    expect(mockToast.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        title: 'Invalid clipboard item',
        description: expect.stringContaining('Source and target schema types are not compatible'),
      }),
    )
  })
})
