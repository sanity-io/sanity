import {describe, expect, it} from 'vitest'

import {
  getUniqueIdentifierForName,
  resultSuffix,
  sanitizeIdentifier,
  toQueryVariableName,
  toResultTypeName,
} from './naming'

describe('naming', () => {
  it('sanitizes names into identifiers the way @sanity/codegen does', () => {
    expect(sanitizeIdentifier('foo-bar')).toBe('fooBar')
    expect(sanitizeIdentifier('foo.bar')).toBe('fooBar')
    expect(sanitizeIdentifier('sanity.imageAsset')).toBe('sanityImageAsset')
    expect(sanitizeIdentifier('2fast')).toBe('_fast')
    expect(sanitizeIdentifier('my type v2')).toBe('myTypeV2')
  })

  it('suffixes identifiers that are taken or reserved', () => {
    const taken = new Set(['FooBar', 'FooBar_2'])
    expect(getUniqueIdentifierForName('foo-bar', taken)).toBe('FooBar_3')
    expect(getUniqueIdentifierForName('ArrayOf', taken)).toBe('ArrayOf_2')
    expect(getUniqueIdentifierForName('author', taken)).toBe('Author')
  })

  it('follows the casing of the query variable for the result suffix', () => {
    expect(resultSuffix('authorQuery')).toBe('authorQueryResult')
    expect(resultSuffix('AUTHOR_QUERY')).toBe('AUTHOR_QUERY_RESULT')
    expect(resultSuffix('author_query')).toBe('author_query_result')
    expect(resultSuffix('Author Query!')).toBe('AuthorQueryResult')
    expect(resultSuffix('')).toBe('result')
  })

  it('names the query variable after the tab title or what the query is about', () => {
    expect(toQueryVariableName('*[_type == "author"]')).toBe('authorQuery')
    expect(toQueryVariableName('*[_type in ["post", "page"]]')).toBe('postPageQuery')
    expect(
      toQueryVariableName('*[_type in ["manyFieldsTest", "allTypes", "allNativeInputComponents"]]'),
    ).toBe('manyFieldsTestAllTypesAllNativeInputComponentsQuery')
    expect(toQueryVariableName('count(*)')).toBe('countQuery')
    expect(toQueryVariableName('*[_id == "123"]')).toBe('query123')
    expect(toQueryVariableName('')).toBe('query')
    expect(toQueryVariableName('*[_type == "author"]', 'Published posts')).toBe('publishedPosts')
    expect(toQueryVariableName('*[_type == "author"]', '  ')).toBe('authorQuery')
  })

  it('names the result type like typegen, clear of the schema types', () => {
    expect(toResultTypeName('authorQuery')).toBe('AuthorQueryResult')
    expect(toResultTypeName('AUTHOR_QUERY')).toBe('AUTHOR_QUERY_RESULT')
    expect(toResultTypeName('authorQuery', new Set(['AuthorQueryResult']))).toBe(
      'AuthorQueryResult_2',
    )
    expect(
      toResultTypeName(
        toQueryVariableName(
          '*[_type in ["manyFieldsTest", "allTypes", "allNativeInputComponents"]]',
        ),
      ),
    ).toBe('ManyFieldsTestAllTypesAllNativeInputComponentsQueryResult')
  })
})
