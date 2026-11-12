import {describe, expect, it} from 'vitest'

import {hasStrongReferenceTo} from '../useReferringDocuments'

const TARGET = 'book-lighthouse'

describe('hasStrongReferenceTo', () => {
  it('finds a strong reference in a top-level field', () => {
    expect(
      hasStrongReferenceTo({_id: 'a', author: {_type: 'reference', _ref: TARGET}}, TARGET),
    ).toBe(true)
  })

  it('finds a strong reference nested in arrays and objects', () => {
    const document = {
      _id: 'a',
      modules: [{_key: 'm1', books: [{_key: 'b1', _type: 'reference', _ref: TARGET}]}],
    }
    expect(hasStrongReferenceTo(document, TARGET)).toBe(true)
  })

  it('ignores weak references', () => {
    expect(
      hasStrongReferenceTo(
        {_id: 'a', publisher: {_type: 'reference', _ref: TARGET, _weak: true}},
        TARGET,
      ),
    ).toBe(false)
  })

  it('treats a reference waiting to be strengthened on publish as weak, as Content Lake does', () => {
    expect(
      hasStrongReferenceTo(
        {
          _id: 'drafts.a',
          author: {_type: 'reference', _ref: TARGET, _weak: true, _strengthenOnPublish: {}},
        },
        TARGET,
      ),
    ).toBe(false)
  })

  it('ignores references to other documents', () => {
    expect(
      hasStrongReferenceTo({_id: 'a', author: {_type: 'reference', _ref: 'other'}}, TARGET),
    ).toBe(false)
  })

  it('ignores the identity references in _system', () => {
    const variantCopy = {
      _id: `versions.scope.${TARGET}`,
      _system: {group: {_ref: TARGET, _weak: true}, variants: [{_key: 'v', _ref: TARGET}]},
    }
    expect(hasStrongReferenceTo(variantCopy, TARGET)).toBe(false)
  })
})
