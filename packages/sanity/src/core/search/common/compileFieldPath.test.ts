import {describe, expect, test as baseTest, vi} from 'vitest'

import {bookType as book, withArraysType as withArrays} from './__fixtures__/mockSortSchema'
import {
  resetCompileFieldPathWarningCache,
  compileFieldPath as compileFieldPathImpl,
} from './compileFieldPath'

const test = baseTest.extend<{compileFieldPath: typeof compileFieldPathImpl}>({
  // eslint-disable-next-line no-empty-pattern
  compileFieldPath: async ({}, consume) => {
    resetCompileFieldPathWarningCache()
    await consume(compileFieldPathImpl)
    vi.restoreAllMocks()
  },
})

describe('compileFieldPath', () => {
  test('returns simple top-level field unchanged', ({compileFieldPath}) => {
    expect(compileFieldPath(book, 'title')).toBe('title')
  })

  test('compiles nested object access as a literal dotted path', ({compileFieldPath}) => {
    expect(compileFieldPath(book, 'translations.se')).toBe('translations.se')
  })

  test('inserts `->` for single-target reference traversal', ({compileFieldPath}) => {
    expect(compileFieldPath(book, 'author.name')).toBe('author->name')
  })

  test('inserts `->` for deeper reference traversal', ({compileFieldPath}) => {
    expect(compileFieldPath(book, 'author.bestFriend.name')).toBe('author->bestFriend->name')
  })

  test('compiles array index + reference to dereferenced expression', ({compileFieldPath}) => {
    expect(compileFieldPath(withArrays, 'items[0].value')).toBe('items[0]->value')
  })

  test('compiles keyed array access + reference', ({compileFieldPath}) => {
    expect(compileFieldPath(withArrays, 'items[_key=="abc"].value')).toBe(
      'items[_key=="abc"]->value',
    )
  })

  test('compiles array index + nested object access', ({compileFieldPath}) => {
    expect(compileFieldPath(withArrays, 'tags[0].label')).toBe('tags[0].label')
  })

  test('compiles object-then-reference chain (coverImage.asset.size)', ({compileFieldPath}) => {
    expect(compileFieldPath(book, 'coverImage.asset.size')).toBe('coverImage.asset->size')
  })

  test('walks multi-target references by trying each target until one matches', ({
    compileFieldPath,
  }) => {
    // `editorOnlyField` only exists on the `editor` target of
    // `contributor`. The compiler should walk past `author` and find
    // it on `editor`.
    expect(compileFieldPath(book, 'contributor.editorOnlyField')).toBe(
      'contributor->editorOnlyField',
    )
  })

  test('walks multi-target references when the field exists on the first target', ({
    compileFieldPath,
  }) => {
    // `name` exists on both `author` and `editor`.
    expect(compileFieldPath(book, 'contributor.name')).toBe('contributor->name')
  })

  test('does not warn for non-matching targets when probing a multi-target reference', ({
    compileFieldPath,
  }) => {
    // `editorOnlyField` only exists on the `editor` target of
    // `contributor`. While walking, the compiler probes each target
    // in turn and silences per-target resolution failures — only
    // surfacing an error if *all* targets fail. Without that
    // silencing, the `author` probe would emit a spurious
    // "nonexistent field" warning before `editor` resolves.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(compileFieldPath(book, 'contributor.editorOnlyField')).toBe(
      'contributor->editorOnlyField',
    )
    expect(warn).not.toHaveBeenCalled()
  })

  test('returns input unchanged when schemaType is undefined', ({compileFieldPath}) => {
    // Without a schema we can't infer `->`; the path is treated
    // literally.
    expect(compileFieldPath(undefined, 'arbitrary.path[0].thing')).toBe('arbitrary.path[0].thing')
  })

  test('returns simple field unchanged when schemaType is undefined', ({compileFieldPath}) => {
    expect(compileFieldPath(undefined, '_id')).toBe('_id')
  })

  test('treats built-in document fields as bare leaves', ({compileFieldPath}) => {
    expect(compileFieldPath(book, '_updatedAt')).toBe('_updatedAt')
  })

  test('warns and returns input unchanged on missing field (non-strict)', ({compileFieldPath}) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(compileFieldPath(book, 'nonExistentField')).toBe('nonExistentField')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent field "nonExistentField"'),
    )
  })

  test('warns and returns input unchanged on traversal into non-object (non-strict)', ({
    compileFieldPath,
  }) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(compileFieldPath(book, 'title.foo')).toBe('title.foo')
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('the field "foo" on non-object schema type'),
    )
  })

  test('throws in strict mode when ordering targets missing field', ({compileFieldPath}) => {
    expect(() => compileFieldPath(book, 'nonExistentField', {strict: true})).toThrow(
      'A sort ordering references the nonexistent field "nonExistentField"',
    )
  })

  test('throws in strict mode when ordering targets missing nested field', ({compileFieldPath}) => {
    expect(() => compileFieldPath(book, 'translations.fi', {strict: true})).toThrow(
      'A sort ordering references the nonexistent field "fi"',
    )
  })

  test('throws in strict mode on traversal into non-object schema type', ({compileFieldPath}) => {
    expect(() => compileFieldPath(book, 'title.foo', {strict: true})).toThrow(
      'the field "foo" on non-object schema type',
    )
  })

  test('throws in strict mode on array access on non-array field', ({compileFieldPath}) => {
    expect(() => compileFieldPath(withArrays, 'title[0]', {strict: true})).toThrow(
      'array access on non-array field "title"',
    )
  })

  test('throws in strict mode on multi-type array with nested path', ({compileFieldPath}) => {
    expect(() => compileFieldPath(withArrays, 'mixed[0].nested', {strict: true})).toThrow(
      'Array ordering requires a single member type',
    )
  })

  test('throws in strict mode on range slice', ({compileFieldPath}) => {
    expect(() => compileFieldPath(withArrays, 'items[0:5].value', {strict: true})).toThrow(
      'Range slices are not supported for ordering',
    )
  })

  test('includes ordering name in error message when provided', ({compileFieldPath}) => {
    expect(() =>
      compileFieldPath(book, 'nonExistentField', {strict: true, orderingName: 'By missing field'}),
    ).toThrow('The sort ordering "By missing field" references')
  })

  test('returns empty string for empty fieldPath', ({compileFieldPath}) => {
    expect(compileFieldPath(book, '')).toBe('')
  })

  test('deduplicates warnings for repeated invalid paths', ({compileFieldPath}) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    compileFieldPath(book, 'nonExistentField')
    compileFieldPath(book, 'nonExistentField')
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
