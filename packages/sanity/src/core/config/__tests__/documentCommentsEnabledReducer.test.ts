import {describe, expect, it} from 'vitest'

import {documentCommentsEnabledReducer} from '../configPropertyReducers'
import {type PluginOptions} from '../types'

describe('documentCommentsEnabledReducer', () => {
  it('returns the initial value when no config is provided', () => {
    const config: PluginOptions = {name: 'test'}

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: true,
    })

    expect(result).toBe(true)
  })

  it('returns false when config sets enabled to false', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: false,
        },
      },
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: true,
    })

    expect(result).toBe(false)
  })

  it('returns true when config sets enabled to true', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: true,
        },
      },
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: false,
    })

    expect(result).toBe(true)
  })

  it('supports a function that returns true', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: () => true,
        },
      },
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: false,
    })

    expect(result).toBe(true)
  })

  it('supports a function that returns false', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: () => false,
        },
      },
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: true,
    })

    expect(result).toBe(false)
  })

  it('passes context to the function', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: (ctx) => ctx.documentType === 'article',
        },
      },
    }

    expect(
      documentCommentsEnabledReducer({
        config,
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toBe(true)

    expect(
      documentCommentsEnabledReducer({
        config,
        context: {documentId: 'doc1', documentType: 'page'},
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('the last plugin wins when multiple plugins configure comments', () => {
    const config: PluginOptions = {
      name: 'test',
      plugins: [
        {
          name: 'plugin-a',
          document: {
            comments: {
              enabled: true,
            },
          },
        },
        {
          name: 'plugin-b',
          document: {
            comments: {
              enabled: false,
            },
          },
        },
      ],
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: true,
    })

    expect(result).toBe(false)
  })

  it('handles undefined documentId in context', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          enabled: (ctx) => ctx.documentId === undefined,
        },
      },
    }

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: undefined, documentType: 'article'},
      initialValue: false,
    })

    expect(result).toBe(true)
  })

  it('throws when enabled is not a boolean or function', () => {
    const config: PluginOptions = {
      name: 'test',
      document: {
        comments: {
          // @ts-expect-error -- invalid config
          enabled: 'yes',
        },
      },
    }

    expect(() =>
      documentCommentsEnabledReducer({
        config,
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toThrow(
      'Expected `document.comments.enabled` to be a boolean or a function, but received string',
    )
  })

  it('ignores leftover document.unstable_comments config', () => {
    const config = {
      name: 'test',
      document: {
        unstable_comments: {
          enabled: false,
        },
      },
    } as PluginOptions

    const result = documentCommentsEnabledReducer({
      config,
      context: {documentId: 'doc1', documentType: 'article'},
      initialValue: true,
    })

    expect(result).toBe(true)
  })
})
