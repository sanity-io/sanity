import {render} from '@testing-library/react'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'
import {describe, expect, it, vi} from 'vitest'

import {type Config, type WorkspaceSummary} from '../../config/types'
import {PreloadStudioShell} from '../lazy'

const chunks = vi.hoisted(() => ({layout: vi.fn(), navbar: vi.fn()}))

// The factories run when the chunk is first imported, which is what the preload does.
vi.mock('../StudioLayoutComponent', () => {
  chunks.layout()
  return {StudioLayoutComponent: () => null}
})
vi.mock('../components/navbar/StudioNavbar', () => {
  chunks.navbar()
  return {StudioNavbar: () => null}
})

function CustomShell() {
  return null
}

function renderPreload(config: Config, workspaceName = 'default') {
  return render(
    <ActiveWorkspaceMatcherContext.Provider
      value={{
        activeWorkspace: {name: workspaceName} as WorkspaceSummary,
        setActiveWorkspace: vi.fn(),
      }}
    >
      <PreloadStudioShell config={config} />
    </ActiveWorkspaceMatcherContext.Provider>,
  )
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('PreloadStudioShell', () => {
  it('skips the defaults the active workspace replaces, and fetches the rest', async () => {
    // The active workspace replaces both shell components at the root of its config: nothing
    // to fetch, however many other workspaces keep the defaults.
    renderPreload(
      [
        {
          name: 'custom',
          basePath: '/custom',
          projectId: 'p',
          dataset: 'd',
          studio: {components: {layout: CustomShell, navbar: CustomShell}},
        },
        {name: 'other', basePath: '/other', projectId: 'p', dataset: 'd'},
      ],
      'custom',
    ).unmount()
    await flush()
    expect(chunks.layout).not.toHaveBeenCalled()
    expect(chunks.navbar).not.toHaveBeenCalled()

    // Only the layout is replaced: the default navbar is still preloaded.
    renderPreload({
      projectId: 'p',
      dataset: 'd',
      studio: {components: {layout: CustomShell}},
    }).unmount()
    await flush()
    expect(chunks.layout).not.toHaveBeenCalled()
    expect(chunks.navbar).toHaveBeenCalledTimes(1)

    // No replacements: both defaults are fetched (the navbar chunk is already in the registry).
    renderPreload({projectId: 'p', dataset: 'd'}).unmount()
    await flush()
    expect(chunks.layout).toHaveBeenCalledTimes(1)
    expect(chunks.navbar).toHaveBeenCalledTimes(1)
  })
})
