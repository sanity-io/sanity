import {describe, expect, test} from 'vitest'

import {isFieldPathExcludedFromIndex} from '../isFieldPathExcludedFromIndex'

describe('isFieldPathExcludedFromIndex', () => {
  test('nothing is excluded when there are no excluded paths', () => {
    expect(isFieldPathExcludedFromIndex('title', {})).toBe(false)
    expect(isFieldPathExcludedFromIndex('title', {excludeFieldPaths: []})).toBe(false)
  })

  test('an excluded path excludes itself and every path below it', () => {
    const fieldPaths = {excludeFieldPaths: ['analytics']}

    expect(isFieldPathExcludedFromIndex('analytics', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('analytics.pageName', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('analytics[].pageName', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('analytics.meta.slug.current', fieldPaths)).toBe(true)
  })

  test('an excluded path does not exclude siblings sharing its prefix', () => {
    const fieldPaths = {excludeFieldPaths: ['analytics']}

    expect(isFieldPathExcludedFromIndex('analyticsLabel', fieldPaths)).toBe(false)
    expect(isFieldPathExcludedFromIndex('title', fieldPaths)).toBe(false)
    expect(isFieldPathExcludedFromIndex('page.analytics', fieldPaths)).toBe(false)
  })

  test('an excluded array item path excludes fields of the array items only', () => {
    const fieldPaths = {excludeFieldPaths: ['labels[]']}

    expect(isFieldPathExcludedFromIndex('labels[].text', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('labels', fieldPaths)).toBe(false)
  })

  test('a nested excluded path excludes only that nested subtree', () => {
    const fieldPaths = {excludeFieldPaths: ['seo.description']}

    expect(isFieldPathExcludedFromIndex('seo.description', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('seo.title', fieldPaths)).toBe(false)
  })

  test('an included path more specific than the exclusion keeps the path', () => {
    const fieldPaths = {
      excludeFieldPaths: ['analytics'],
      includeFieldPaths: ['analytics.pageName'],
    }

    expect(isFieldPathExcludedFromIndex('analytics.pageName', fieldPaths)).toBe(false)
    expect(isFieldPathExcludedFromIndex('analytics.campaign', fieldPaths)).toBe(true)
  })

  test('a path that is both excluded and included at the same level stays excluded', () => {
    const fieldPaths = {excludeFieldPaths: ['content'], includeFieldPaths: ['content']}

    expect(isFieldPathExcludedFromIndex('content', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('content.heading', fieldPaths)).toBe(true)
  })

  test('an included path less specific than the exclusion does not keep the path', () => {
    const fieldPaths = {excludeFieldPaths: ['page.analytics'], includeFieldPaths: ['page']}

    expect(isFieldPathExcludedFromIndex('page.analytics.pageName', fieldPaths)).toBe(true)
    expect(isFieldPathExcludedFromIndex('page.title', fieldPaths)).toBe(false)
  })
})
