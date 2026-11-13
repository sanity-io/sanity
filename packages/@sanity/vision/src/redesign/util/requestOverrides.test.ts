import {describe, expect, test} from 'vitest'

import {type RequestEnvironment} from '../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../store/types'
import {getRequestOverrides} from './requestOverrides'

const environment: RequestEnvironment = {
  workspaceDataset: 'production',
  perspectiveStack: ['drafts'],
  selectedVariantNames: ['en'],
  isVariantsEnabled: true,
  scheduledDraftsStack: undefined,
  isScheduledDraftsEnabled: false,
}

const following: VisionTabOptions = {
  datasetMode: 'workspace',
  dataset: 'production',
  apiVersion: 'v2025-02-19',
  perspective: 'global',
  variant: 'global',
  includeSourceMap: false,
  useCdn: false,
}

describe('getRequestOverrides', () => {
  test('reports nothing while the tab follows the studio', () => {
    expect(getRequestOverrides(following, environment)).toEqual({
      dataset: undefined,
      perspective: false,
      variant: undefined,
    })
  })

  test('reports a pinned dataset only when it is not the workspace one', () => {
    const pinned = {...following, datasetMode: 'pinned' as const}
    expect(getRequestOverrides(pinned, environment).dataset).toBeUndefined()
    expect(getRequestOverrides({...pinned, dataset: 'staging'}, environment).dataset).toEqual({
      dataset: 'staging',
      workspaceDataset: 'production',
    })
  })

  test('reports a perspective only when it asks for other documents than the navbar', () => {
    expect(
      getRequestOverrides({...following, perspective: 'drafts'}, environment).perspective,
    ).toBe(false)
    expect(getRequestOverrides({...following, perspective: 'raw'}, environment).perspective).toBe(
      true,
    )
    expect(
      getRequestOverrides(
        {...following, perspective: 'published'},
        {...environment, perspectiveStack: ['published']},
      ).perspective,
    ).toBe(false)
  })

  test('reports an opted-out variant only while the navbar has one', () => {
    expect(getRequestOverrides({...following, variant: 'none'}, environment).variant).toEqual({
      globalVariant: 'en',
    })
    expect(
      getRequestOverrides(
        {...following, variant: 'none'},
        {...environment, selectedVariantNames: []},
      ).variant,
    ).toBeUndefined()
  })
})
