import {createClient} from '@sanity/client'
import {type DashboardTopics, type ValueOf} from '@sanity/sdk/dashboard'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {createMockAuthStore} from '../../store/auth/mock/createMockAuthStore'
import {createSourceFromConfig} from '../resolveConfig'
import {type SingleWorkspace} from '../types'

/**
 * Composition tests: `federatedAssetSources` and the brokered views published
 * on the workbench message bus, resolved all the way through
 * `prepareConfig`/`createSourceFromConfig` into `form.file.assetSources` and
 * `form.image.assetSources`. The reducer's own precedence/validation behavior
 * is covered in `configPropertyReducers.test.ts`; the bus-entry mapping in
 * `federatedAssetSource/__tests__/discovery.test.ts`.
 */

type ApplicationsList = Extract<
  NonNullable<ValueOf<'applications.list', DashboardTopics>>,
  {ok: true}
>['value']
type ListedEntry = ApplicationsList[number]
type ListedApplication = Extract<ListedEntry, {type: 'studio' | 'coreApp'}>
type Deployment = NonNullable<ListedApplication['activeDeployment']>
type InterfaceRecord = NonNullable<Deployment['interfaces']>[number]

// Minimal fixture builders, mirroring discovery.test.ts.
function assetSourceInterface(fields: {name: string; moduleId: string}): InterfaceRecord {
  return {
    id: `interface-${fields.name}`,
    title: fields.name,
    version: '1.0.0',
    type: 'asset_source',
    metadata: null,
    ...fields,
  }
}

function application(
  fields: {id: string; name: string} & Partial<ListedApplication>,
): ListedApplication {
  return {
    type: 'studio',
    title: fields.name,
    reference: '',
    icon: null,
    isSingleton: false,
    visibility: 'default',
    slug: null,
    externalUrl: `https://${fields.id}.example`,
    organizationId: 'org-1',
    createdAt: '',
    updatedAt: '',
    config: {mfManifest: {}} as ListedApplication['config'],
    activeDeployment: null,
    ...fields,
  }
}

function appWithView(fields: {id: string; name: string; viewName: string}): ListedApplication {
  return application({
    id: fields.id,
    name: fields.name,
    activeDeployment: {
      id: `deployment-${fields.id}`,
      applicationId: fields.id,
      size: null,
      version: null,
      isAutoUpdating: null,
      isActiveDeployment: true,
      deployedBy: null,
      createdAt: '',
      updatedAt: '',
      interfaces: [
        assetSourceInterface({name: fields.viewName, moduleId: `views/${fields.viewName}`}),
      ],
    },
  })
}

function publishViews(entries: ApplicationsList) {
  stubMessageBusHost().publish('applications.list', {ok: true, value: entries})
}

/** An app list with the Media Library's own view and two third-party views. */
function defaultEntries(): ApplicationsList {
  return [
    appWithView({id: 'media-app', name: 'media-library', viewName: 'select'}),
    appWithView({id: 'stock-app', name: 'stock-photos', viewName: 'stock'}),
    appWithView({id: 'dam-app', name: 'acme-dam', viewName: 'picker'}),
  ]
}

// prepareConfig caches per raw workspace object — build a fresh one per test.
// The mock auth store keeps source resolution offline (no getCurrentUser
// request), matching resolveConfig.test.ts.
function workspaceConfig(overrides: Partial<SingleWorkspace>): SingleWorkspace {
  const projectId = 'ppsg7ml5'
  const dataset = 'test'
  return {
    name: 'default',
    projectId,
    dataset,
    auth: createMockAuthStore({
      client: createClient({projectId, dataset, apiVersion: '2025-01-01', useCdn: false}),
      currentUser: null,
    }),
    ...overrides,
  }
}

async function resolveAssetSources(overrides: Partial<SingleWorkspace>) {
  const source = await createSourceFromConfig(workspaceConfig(overrides))
  return {file: source.form.file.assetSources, image: source.form.image.assetSources}
}

beforeEach(() => {
  // The "federated fallback" console.info is a module-level one-shot in
  // prepareConfig; silence it so the first test to trigger it stays quiet.
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('prepareConfig — federatedAssetSources composition', () => {
  it('adds no sources outside the workbench (no message bus), even when enabled', async () => {
    const {file, image} = await resolveAssetSources({
      federatedAssetSources: {enabled: true},
    })

    expect(file.map((s) => s.name)).toEqual(['sanity-default'])
    expect(image.map((s) => s.name)).toEqual(['sanity-default'])
  })

  it('ignores brokered views when federatedAssetSources is not enabled', async () => {
    publishViews(defaultEntries())

    const {file, image} = await resolveAssetSources({
      mediaLibrary: {enabled: true},
    })

    expect(file.map((s) => s.name)).toEqual(['sanity-media-library', 'sanity-default'])
    expect(image.map((s) => s.name)).toEqual(['sanity-media-library', 'sanity-default'])
  })

  it('surfaces third-party brokered views as sources on both file and image, excluding the Media Library view', async () => {
    publishViews(defaultEntries())

    const {file, image} = await resolveAssetSources({
      mediaLibrary: {enabled: true},
      federatedAssetSources: {enabled: true},
    })

    const expected = ['sanity-media-library', 'sanity-default', 'stock-app:stock', 'dam-app:picker']
    expect(file.map((s) => s.name)).toEqual(expected)
    expect(image.map((s) => s.name)).toEqual(expected)
    // The Media Library's own view replaces the built-in source's dialog; it
    // must never double up as a third-party source.
    expect(file.filter((s) => s.name.startsWith('media-app:'))).toEqual([])
  })

  it('passes each view through the filter and keeps only accepted ones', async () => {
    publishViews(defaultEntries())
    const filter = vi.fn(({name}: {name: string}) => name === 'stock')

    const {file} = await resolveAssetSources({
      federatedAssetSources: {enabled: true, filter},
    })

    expect(filter).toHaveBeenCalledTimes(2)
    expect(filter).toHaveBeenCalledWith({
      applicationId: 'stock-app',
      applicationName: 'stock-photos',
      applicationTitle: 'stock-photos',
      name: 'stock',
      title: 'stock',
    })
    expect(filter).toHaveBeenCalledWith({
      applicationId: 'dam-app',
      applicationName: 'acme-dam',
      applicationTitle: 'acme-dam',
      name: 'picker',
      title: 'picker',
    })
    expect(file.map((s) => s.name)).toEqual(['sanity-default', 'stock-app:stock'])
  })

  it('advertises upload support only for views the uploads callback opts in', async () => {
    publishViews(defaultEntries())

    const {file} = await resolveAssetSources({
      federatedAssetSources: {enabled: true, uploads: ({name}) => name === 'stock'},
    })

    const stock = file.find((s) => s.name === 'stock-app:stock')
    const picker = file.find((s) => s.name === 'dam-app:picker')
    expect(stock?.Uploader).toBeDefined()
    expect(picker?.Uploader).toBeUndefined()
  })

  it('composes across plugins: a plugin enables brokered sources, the workspace filters them', async () => {
    publishViews(defaultEntries())

    const {file} = await resolveAssetSources({
      plugins: [{name: 'enable-brokered-sources', federatedAssetSources: {enabled: true}}],
      federatedAssetSources: {filter: ({name}) => name === 'picker'},
    })

    expect(file.map((s) => s.name)).toEqual(['sanity-default', 'dam-app:picker'])
  })

  it('never costs the Media Library source: the federated flag without a published view keeps the built-in source', async () => {
    // Workbench bus is up, but the application list has no Media Library view
    // (e.g. cold start before the list is published).
    publishViews([])

    const {file, image} = await resolveAssetSources({
      mediaLibrary: {enabled: true, __internal: {federatedAssetSource: true}},
    })

    expect(file.map((s) => s.name)).toEqual(['sanity-media-library', 'sanity-default'])
    expect(image.map((s) => s.name)).toEqual(['sanity-media-library', 'sanity-default'])
  })
})
