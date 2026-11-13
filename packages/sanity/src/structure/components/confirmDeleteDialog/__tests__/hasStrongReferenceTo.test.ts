import {describe, expect, it} from 'vitest'

import {classifyReferrer, hasStrongReferenceTo} from '../useReferringDocuments'

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

describe('classifyReferrer', () => {
  const strong = {_type: 'reference', _ref: TARGET}

  it('marks a strong link in a published document or draft as required', () => {
    expect(classifyReferrer({_id: 'a', author: strong}, TARGET)).toEqual({
      required: true,
      failsLater: false,
    })
    expect(
      classifyReferrer(
        {_id: 'drafts.a', _system: {group: {_ref: 'a'}, bundleId: 'drafts'}, author: strong},
        TARGET,
      ),
    ).toEqual({required: true, failsLater: false})
  })

  it('marks a strong link in a variant copy as required', () => {
    expect(
      classifyReferrer(
        {
          _id: 'versions.scope-de.a',
          _system: {bundleId: 'drafts', variants: [{_ref: '_.variants.de-DE'}]},
          author: strong,
        },
        TARGET,
      ),
    ).toEqual({required: true, failsLater: false})
  })

  it('marks a strong link held only by a release copy as failing later, not required', () => {
    expect(
      classifyReferrer(
        {
          _id: 'versions.rel.a',
          _system: {bundleId: 'rel', release: {_ref: '_.releases.rel'}},
          author: strong,
        },
        TARGET,
      ),
    ).toEqual({required: false, failsLater: true})
  })

  it('treats a version id without `_system` as a release copy', () => {
    expect(classifyReferrer({_id: 'versions.rel.a', author: strong}, TARGET)).toEqual({
      required: false,
      failsLater: true,
    })
  })

  it('marks weak links as neither', () => {
    expect(
      classifyReferrer(
        {
          _id: 'versions.rel.a',
          _system: {release: {_ref: '_.releases.rel'}},
          author: {...strong, _weak: true},
        },
        TARGET,
      ),
    ).toEqual({required: false, failsLater: false})
  })
})
