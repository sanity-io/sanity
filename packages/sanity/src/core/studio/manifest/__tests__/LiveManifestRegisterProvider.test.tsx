import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useLiveUserApplication} from '../../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../../workspaces/useWorkspaces'
import {LiveManifestRegisterProvider} from '../LiveManifestRegisterProvider'
import {registerStudioManifest} from '../registerLiveStudioManifest'

const theme = {}

vi.mock('@sanity/ui', () => ({
  useRootTheme: vi.fn(() => ({theme})),
}))
vi.mock('../../liveUserApplication/useLiveUserApplication', () => ({
  useLiveUserApplication: vi.fn(),
}))
vi.mock('../../workspaces/useWorkspaces', () => ({useWorkspaces: vi.fn()}))
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

  it('registers the manifest with the resolved user application, workspaces and theme', async () => {
    render(<LiveManifestRegisterProvider />)
    await vi.waitFor(() =>
      expect(registerStudioManifest).toHaveBeenCalledWith(
        userApplication,
        workspaces,
        theme,
        expect.any(AbortSignal),
      ),
    )
  })

  it('starts only the upload of the remounted provider under StrictMode', async () => {
    render(
      <StrictMode>
        <LiveManifestRegisterProvider />
      </StrictMode>,
    )

    // StrictMode mounts, unmounts, then remounts: cleanup aborts the first mount's signal
    // before the registration code has loaded, so only the remount uploads.
    await vi.waitFor(() => expect(registerStudioManifest).toHaveBeenCalledTimes(1))
    await vi.dynamicImportSettled()
    expect(registerStudioManifest).toHaveBeenCalledTimes(1)
    expect(vi.mocked(registerStudioManifest).mock.calls[0][3]?.aborted).toBe(false)
  })

  it('does not register when there is no user application', async () => {
    vi.mocked(useLiveUserApplication).mockReturnValue({userApplication: undefined} as never)
    render(<LiveManifestRegisterProvider />)
    await vi.dynamicImportSettled()
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })

  it('does not register when there are no workspaces', async () => {
    vi.mocked(useWorkspaces).mockReturnValue([] as never)
    render(<LiveManifestRegisterProvider />)
    await vi.dynamicImportSettled()
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })
})
