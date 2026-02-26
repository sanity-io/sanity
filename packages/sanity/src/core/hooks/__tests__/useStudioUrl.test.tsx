import {renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {useStudioAppIdStore} from '../../create/studio-app/useStudioAppIdStore'
import {useProjectOrganizationId} from '../../store/_legacy/project/useProjectOrganizationId'
import {useRenderingContext} from '../../store/renderingContext/useRenderingContext'
import {useActiveWorkspace} from '../../studio'
import {useEnvAwareSanityWebsiteUrl} from '../../studio/hooks/useEnvAwareSanityWebsiteUrl'
import {getDashboardPath} from '../../util/dashboardPath'
import {useStudioUrl} from '../useStudioUrl'

vi.mock('../../store/renderingContext/useRenderingContext', () => ({
  useRenderingContext: vi.fn(),
}))

vi.mock('../../create/studio-app/useStudioAppIdStore', () => ({
  useStudioAppIdStore: vi.fn(),
}))

vi.mock('../../store/_legacy/project/useProjectOrganizationId', () => ({
  useProjectOrganizationId: vi.fn(),
}))

vi.mock('../../studio', () => ({
  useActiveWorkspace: vi.fn(),
}))

vi.mock('../../studio/hooks/useEnvAwareSanityWebsiteUrl', () => ({
  useEnvAwareSanityWebsiteUrl: vi.fn(),
}))

vi.mock('../../util/dashboardPath', () => ({
  getDashboardPath: vi.fn(),
}))

const mockUseRenderingContext = useRenderingContext as Mock
const mockUseStudioAppIdStore = useStudioAppIdStore as Mock
const mockUseActiveWorkspace = useActiveWorkspace as Mock
const mockUseProjectOrganizationId = useProjectOrganizationId as Mock
const mockUseEnvAwareSanityWebsiteUrl = useEnvAwareSanityWebsiteUrl as Mock
const mockGetDashboardPath = getDashboardPath as Mock

function setupStudioContext() {
  mockUseRenderingContext.mockReturnValue(null)
  mockUseStudioAppIdStore.mockReturnValue({studioApp: null, loading: false})
  mockUseActiveWorkspace.mockReturnValue({activeWorkspace: {name: 'default'}})
  mockUseProjectOrganizationId.mockReturnValue({value: null, loading: false})
  mockUseEnvAwareSanityWebsiteUrl.mockReturnValue('https://www.sanity.io')
}

function setupCoreUiContext() {
  mockUseRenderingContext.mockReturnValue({name: 'coreUi'})
  mockUseStudioAppIdStore.mockReturnValue({studioApp: {appId: 'my-app'}, loading: false})
  mockUseActiveWorkspace.mockReturnValue({activeWorkspace: {name: 'default'}})
  mockUseProjectOrganizationId.mockReturnValue({value: 'org-123', loading: false})
  mockUseEnvAwareSanityWebsiteUrl.mockReturnValue('https://www.sanity.io')
  mockGetDashboardPath.mockReturnValue(
    'https://www.sanity.io/organizations/org-123/apps/my-app/workspaces/default',
  )
}

describe('useStudioUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('studioUrl', () => {
    it('returns window.location.origin in studio context', () => {
      setupStudioContext()

      const {result} = renderHook(() => useStudioUrl())

      expect(result.current.studioUrl).toBe(window.location.origin)
    })

    it('returns defaultUrl when provided in studio context', () => {
      setupStudioContext()

      const {result} = renderHook(() => useStudioUrl('https://my-studio.sanity.studio'))

      expect(result.current.studioUrl).toBe('https://my-studio.sanity.studio')
    })

    it('returns dashboard path in coreUi context', () => {
      setupCoreUiContext()

      const {result} = renderHook(() => useStudioUrl())

      expect(result.current.studioUrl).toBe(
        'https://www.sanity.io/organizations/org-123/apps/my-app/workspaces/default',
      )
    })

    it('falls back to origin when coreUi data is still loading', () => {
      setupCoreUiContext()
      mockUseStudioAppIdStore.mockReturnValue({studioApp: {appId: 'my-app'}, loading: true})

      const {result} = renderHook(() => useStudioUrl())

      expect(result.current.studioUrl).toBe(window.location.origin)
    })
  })

  describe('buildStudioUrl', () => {
    it('calls studio modifier in studio context', () => {
      setupStudioContext()
      const studioFn = vi.fn((url: string) => `${url}/custom-path`)

      const {result} = renderHook(() => useStudioUrl())
      const built = result.current.buildStudioUrl({studio: studioFn})

      expect(studioFn).toHaveBeenCalledWith(window.location.origin)
      expect(built).toBe(`${window.location.origin}/custom-path`)
    })

    it('calls coreUi modifier in coreUi context', () => {
      setupCoreUiContext()
      const coreUiFn = vi.fn((url: string) => `${url}/custom-path`)

      const {result} = renderHook(() => useStudioUrl())
      const built = result.current.buildStudioUrl({coreUi: coreUiFn})

      expect(coreUiFn).toHaveBeenCalledWith(
        'https://www.sanity.io/organizations/org-123/apps/my-app/workspaces/default',
      )
      expect(built).toBe(
        'https://www.sanity.io/organizations/org-123/apps/my-app/workspaces/default/custom-path',
      )
    })

    it('returns studioUrl when no matching modifier is provided', () => {
      setupStudioContext()

      const {result} = renderHook(() => useStudioUrl())
      const built = result.current.buildStudioUrl({
        coreUi: (url) => `${url}/only-for-coreui`,
      })

      expect(built).toBe(window.location.origin)
    })
  })
})
