import {describe, expect, it} from 'vitest'

import {documentAskToEditEnabledReducer} from '../configPropertyReducers'
import {type PluginOptions} from '../types'

describe('documentAskToEditEnabledReducer', () => {
  it('returns the initial value when no config is provided', () => {
    const config: PluginOptions = {name: 'test'}

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: false,
        },
      },
    }

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: true,
        },
      },
    }

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: () => true,
        },
      },
    }

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: () => false,
        },
      },
    }

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: (ctx) => ctx.documentType === 'article',
        },
      },
    }

    expect(
      documentAskToEditEnabledReducer({
        config,
        context: {documentId: 'doc1', documentType: 'article'},
        initialValue: true,
      }),
    ).toBe(true)

    expect(
      documentAskToEditEnabledReducer({
        config,
        context: {documentId: 'doc1', documentType: 'page'},
        initialValue: true,
      }),
    ).toBe(false)
  })

  it('the last plugin wins when multiple plugins configure askToEdit', () => {
    const config: PluginOptions = {
      name: 'test',
      plugins: [
        {
          name: 'plugin-a',
          document: {
            askToEdit: {
              enabled: true,
            },
          },
        },
        {
          name: 'plugin-b',
          document: {
            askToEdit: {
              enabled: false,
            },
          },
        },
      ],
    }

    const result = documentAskToEditEnabledReducer({
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
        askToEdit: {
          enabled: (ctx) => ctx.documentId === undefined,
        },
      },
    }

    const result = documentAskToEditEnabledReducer({
      config,
      context: {documentId: undefined, documentType: 'article'},
      initialValue: false,
    })

    expect(result).toBe(true)
  })
})
