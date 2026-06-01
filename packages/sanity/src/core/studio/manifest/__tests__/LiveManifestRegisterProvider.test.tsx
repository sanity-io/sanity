import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useLiveUserApplication} from '../../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../../workspaces'
import {LiveManifestRegisterProvider} from '../LiveManifestRegisterProvider'
import {registerStudioManifest} from '../registerLiveStudioManifest'

const theme = {}

vi.mock('@sanity/ui', () => ({
  useRootTheme: vi.fn(() => ({theme})),
}))
vi.mock('../../liveUserApplication/useLiveUserApplication', () => ({
  useLiveUserApplication: vi.fn(),
}))
vi.mock('../../workspaces', () => ({
  useWorkspaces: vi.fn(),
}))
vi.mock('../registerLiveStudioManifest', () => ({
  registerStudioManifest: vi.fn().mockResolvedValue(undefined),
}))

describe('LiveManifestRegisterProvider', () => {
  const userApplication = {id: 'app-1', projectId: 'project-1'}
  const workspaces = [{name: 'default', projectId: 'project-1'}]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWorkspaces).mockReturnValue(workspaces as never)
    vi.mocked(useLiveUserApplication).mockReturnValue({userApplication} as never)
  })

  it('registers the manifest with the resolved user application, workspaces and theme', () => {
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).toHaveBeenCalledWith(
      userApplication,
      workspaces,
      theme,
      expect.any(AbortSignal),
    )
  })

  it('aborts the superseded upload when remounted under StrictMode', () => {
    render(
      <StrictMode>
        <LiveManifestRegisterProvider />
      </StrictMode>,
    )

    // StrictMode mounts, unmounts, then remounts: the first upload's signal is aborted by
    // cleanup, so only the second upload runs to completion.
    const [firstCall, secondCall] = vi.mocked(registerStudioManifest).mock.calls
    expect(firstCall[3]?.aborted).toBe(true)
    expect(secondCall[3]?.aborted).toBe(false)
  })

  it('does not register when there is no user application', () => {
    vi.mocked(useLiveUserApplication).mockReturnValue({userApplication: undefined} as never)
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })

  it('does not register when there are no workspaces', () => {
    vi.mocked(useWorkspaces).mockReturnValue([] as never)
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })
})
