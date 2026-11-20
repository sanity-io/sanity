import {describe, expect, it, vi} from 'vitest'

import {getMockWorkspace} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {activeASAPRelease} from '../../releases/__fixtures__/release.fixture'
import {type ReleasePropertyComponent, type ReleasePropertyProps} from '../releases/properties'
import {type ReleasePropertiesResolver} from '../types'

const DefaultRow: ReleasePropertyComponent = () => null
DefaultRow.field = 'legalReview'
const PluginRow: ReleasePropertyComponent = () => null
const RootRow: ReleasePropertyComponent = () => null

const partialContext: ReleasePropertyProps = {release: activeASAPRelease, documents: []}

describe('releases.properties on the resolved workspace', () => {
  it('is undefined when no config defines it', async () => {
    const workspace = await getMockWorkspace({config: {releases: {enabled: true}}})

    expect(workspace.releases?.properties).toBeUndefined()
  })

  it('appends an array to the default rows', async () => {
    const workspace = await getMockWorkspace({config: {releases: {properties: [RootRow]}}})

    expect(workspace.releases?.properties?.(partialContext, [DefaultRow])).toEqual([
      DefaultRow,
      RootRow,
    ])
  })

  it('calls a function with the default rows and the release context', async () => {
    const resolver = vi.fn<ReleasePropertiesResolver>((prev) =>
      prev.filter((row) => row.field !== 'legalReview'),
    )
    const workspace = await getMockWorkspace({config: {releases: {properties: resolver}}})

    expect(workspace.releases?.properties?.(partialContext, [DefaultRow])).toEqual([])
    expect(resolver).toHaveBeenCalledWith(
      [DefaultRow],
      expect.objectContaining({
        release: activeASAPRelease,
        documents: [],
        projectId: workspace.projectId,
      }),
    )
  })

  it('resolves a plugin definition when the root config has no releases key', async () => {
    const workspace = await getMockWorkspace({
      config: {
        releases: undefined,
        plugins: [{name: 'plugin', releases: {properties: [PluginRow]}}],
      },
    })

    expect(workspace.releases?.properties?.(partialContext, [DefaultRow])).toEqual([
      DefaultRow,
      PluginRow,
    ])
  })

  it('composes plugins before the root config', async () => {
    const workspace = await getMockWorkspace({
      config: {
        plugins: [{name: 'plugin', releases: {properties: [PluginRow]}}],
        releases: {properties: (prev) => [RootRow, ...prev]},
      },
    })

    expect(workspace.releases?.properties?.(partialContext, [DefaultRow])).toEqual([
      RootRow,
      DefaultRow,
      PluginRow,
    ])
  })
})
