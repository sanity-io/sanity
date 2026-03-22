import {renderHook} from '@testing-library/react'
import {describe, expect, test, vi} from 'vitest'

import {getVersionId} from '../../util/draftUtils'
import {type AgentBundlesState} from './createAgentBundlesStore'
import {useAgentVersionDisplay} from './useAgentVersionDisplay'

const DOC = 'my-doc'
const MINE = 'agent-mine1'
const OTHER = 'agent-other1'
const RELEASE = 'rABC123'

vi.mock('./useAgentBundles', () => ({useAgentBundles: vi.fn(() => mockState)}))
vi.mock('../../i18n', () => ({useTranslation: () => ({t: (key: string) => key})}))

let mockState: AgentBundlesState = {bundles: [], loading: true}

function ids(...names: string[]) {
  return names.map((n) => getVersionId(DOC, n))
}

describe('useAgentVersionDisplay', () => {
  test('loaded: keeps own bundles, filters others, differentiates display', () => {
    mockState = {bundles: [{id: MINE, applicationKey: 'app'}], loading: false}
    const {result} = renderHook(() => useAgentVersionDisplay(ids(MINE, OTHER, RELEASE)))

    expect(result.current.filteredVersionIds).toEqual(ids(MINE, RELEASE))
    expect(result.current.getVersionDisplay(getVersionId(DOC, MINE))?.displayName).toBe(
      'version.agent-bundle.proposed-changes',
    )
    expect(result.current.getVersionDisplay(getVersionId(DOC, OTHER))?.displayName).toBe(
      'version.agent-bundle.agent-changes',
    )
    expect(result.current.getVersionDisplay(getVersionId(DOC, RELEASE))).toBeNull()
  })

  test('loading: hides all agent bundles except the active one, shows as agent changes', () => {
    mockState = {bundles: [], loading: true}
    const {result} = renderHook(() => useAgentVersionDisplay(ids(MINE, OTHER, RELEASE), MINE))

    expect(result.current.filteredVersionIds).toEqual(ids(MINE, RELEASE))
    expect(result.current.getVersionDisplay(getVersionId(DOC, MINE))?.displayName).toBe(
      'version.agent-bundle.agent-changes',
    )
  })

  test('loaded: only shows the most recent owned agent bundle', () => {
    const MINE2 = 'agent-mine2'
    mockState = {
      bundles: [
        {id: MINE, applicationKey: 'app'},
        {id: MINE2, applicationKey: 'app'},
      ],
      loading: false,
    }
    const {result} = renderHook(() => useAgentVersionDisplay(ids(MINE, MINE2, RELEASE)))

    expect(result.current.filteredVersionIds).toEqual(ids(MINE, RELEASE))
  })

  test('loading without active bundle: hides all agent bundles', () => {
    mockState = {bundles: [], loading: true}
    const {result} = renderHook(() => useAgentVersionDisplay(ids(MINE, OTHER, RELEASE)))

    expect(result.current.filteredVersionIds).toEqual(ids(RELEASE))
  })
})
