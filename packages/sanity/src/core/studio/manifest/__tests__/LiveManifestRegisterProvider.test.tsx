import {render} from '@testing-library/react'
import {StrictMode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {useLiveUserApplication} from '../../liveUserApplication/useLiveUserApplication'
import {useWorkspaces} from '../../workspaces'
import {LiveManifestRegisterProvider} from '../LiveManifestRegisterProvider'
import {registerStudioManifest} from '../registerLiveStudioManifest'

vi.mock('@sanity/ui', () => ({
  useRootTheme: vi.fn(() => ({theme: {}})),
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

  it('uploads the manifest once when mounted normally', () => {
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).toHaveBeenCalledTimes(1)
  })

  it('uploads the manifest only once when mounted in StrictMode', () => {
    render(
      <StrictMode>
        <LiveManifestRegisterProvider />
      </StrictMode>,
    )
    expect(registerStudioManifest).toHaveBeenCalledTimes(1)
  })

  it('does not upload when there is no user application', () => {
    vi.mocked(useLiveUserApplication).mockReturnValue({userApplication: undefined} as never)
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })

  it('does not upload when there are no workspaces', () => {
    vi.mocked(useWorkspaces).mockReturnValue([] as never)
    render(<LiveManifestRegisterProvider />)
    expect(registerStudioManifest).not.toHaveBeenCalled()
  })
})
