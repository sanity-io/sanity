import {type DashboardTopics, type ValueOf} from '@sanity/sdk/dashboard'
import {describe, expect, it} from 'vitest'

import {stubMessageBusHost} from '../../../../../../test/testUtils/stubMessageBusHost'
import {getCurrentFederatedAssetSourceViews, isMediaLibraryView} from '../discovery'

type ApplicationsList = Extract<
  NonNullable<ValueOf<'applications.list', DashboardTopics>>,
  {ok: true}
>['value']
type ListedEntry = ApplicationsList[number]
type ListedApplication = Extract<ListedEntry, {type: 'studio' | 'coreApp'}>
type ListedInstallation = Exclude<ListedEntry, {type: 'studio' | 'coreApp'}>

type Deployment = NonNullable<ListedApplication['activeDeployment']>
type InterfaceRecord = Deployment['interfaces'][number]

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

function deployment(interfaces: InterfaceRecord[]): Deployment {
  return {
    id: 'deployment-1',
    applicationId: 'app-1',
    size: null,
    version: null,
    isAutoUpdating: null,
    isActiveDeployment: true,
    deployedBy: null,
    createdAt: '',
    updatedAt: '',
    interfaces,
  }
}

function application(
  fields: {id: string} & Partial<ListedApplication>,
): ListedApplication {
  return {
    type: 'studio',
    title: '',
    name: '',
    reference: '',
    icon: null,
    isSingleton: false,
    visibility: 'default',
    slug: null,
    externalUrl: null,
    organizationId: 'org-1',
    createdAt: '',
    updatedAt: '',
    config: {},
    activeDeployment: null,
    ...fields,
  }
}

function installation(
  fields: {id: string} & Partial<ListedInstallation>,
): ListedInstallation {
  return {
    applicationId: 'app-1',
    organizationId: 'org-1',
    installedBy: null,
    createdAt: '',
    updatedAt: '',
    application: {
      title: 'Installed app',
      name: 'installed-app',
      reference: 'sanity/installed-app',
      slug: 'installed-app',
      icon: null,
      organizationId: 'publisher-org',
      config: {},
    },
    activeConfig: null,
    access: [],
    interfaces: [],
    ...fields,
  }
}

function publish(entries: ApplicationsList) {
  stubMessageBusHost().publish('applications.list', {ok: true, value: entries})
}

describe('getCurrentFederatedAssetSourceViews', () => {
  it('returns undefined without a message bus (not hosted by the workbench)', () => {
    expect(getCurrentFederatedAssetSourceViews()).toBeUndefined()
  })

  it('returns an empty list when the workbench has not published applications yet', () => {
    stubMessageBusHost()
    expect(getCurrentFederatedAssetSourceViews()).toEqual([])
  })

  it('returns an empty list on an error result', () => {
    stubMessageBusHost().publish('applications.list', {ok: false})
    expect(getCurrentFederatedAssetSourceViews()).toEqual([])
  })

  it('maps a deployed application with a federation manifest, appending the component slot', () => {
    publish([
      application({
        id: 'media-app',
        name: 'media-library',
        title: 'Media Library',
        externalUrl: 'https://media.example/path-is-ignored',
        config: {mfManifest: {}} as ListedApplication['config'],
        activeDeployment: deployment([
          assetSourceInterface({name: 'select', moduleId: 'views/select'}),
          // Non-asset_source interfaces must be ignored.
          {
            id: 'interface-app',
            name: 'app',
            title: 'App',
            version: '1.0.0',
            moduleId: 'views/app',
            type: 'app',
            metadata: null,
          },
        ]),
      }),
    ])

    const views = getCurrentFederatedAssetSourceViews()
    expect(views).toEqual([
      {
        applicationId: 'media-app',
        applicationName: 'media-library',
        applicationTitle: 'Media Library',
        name: 'select',
        title: 'select',
        remote: {name: 'media-app', entry: 'https://media.example/mf-manifest.json'},
        moduleId: 'media-app/views/select/asset_source',
      },
    ])
    expect(views?.every(isMediaLibraryView)).toBe(true)
  })

  it('skips deployed applications without a federation manifest', () => {
    publish([
      application({
        id: 'legacy-app',
        externalUrl: 'https://legacy.example',
        activeDeployment: deployment([
          assetSourceInterface({name: 'picker', moduleId: 'views/picker'}),
        ]),
      }),
    ])

    expect(getCurrentFederatedAssetSourceViews()).toEqual([])
  })

  it('maps a local dev server regardless of manifest config, keeping a full moduleId as-is', () => {
    publish([
      {
        ...application({
          id: 'dev-app',
          name: 'example-asset-source',
          title: 'Example',
          externalUrl: 'http://localhost:3334',
          activeDeployment: deployment([
            assetSourceInterface({name: 'picker', moduleId: 'views/picker/asset_source'}),
          ]),
        }),
        local: {host: 'localhost', port: 3334},
      } as ListedEntry,
    ])

    const views = getCurrentFederatedAssetSourceViews()
    expect(views).toEqual([
      {
        applicationId: 'dev-app',
        applicationName: 'example-asset-source',
        applicationTitle: 'Example',
        name: 'picker',
        title: 'picker',
        remote: {name: 'dev-app', entry: 'http://localhost:3334/mf-manifest.json'},
        moduleId: 'dev-app/views/picker/asset_source',
      },
    ])
    expect(views?.some(isMediaLibraryView)).toBe(false)
  })

  it('maps a third-party installation via its singleton origin', () => {
    publish([
      installation({
        id: 'installation-1',
        interfaces: [assetSourceInterface({name: 'stock', moduleId: 'views/stock'})],
      }),
    ])

    expect(getCurrentFederatedAssetSourceViews()).toEqual([
      {
        applicationId: 'installation-1',
        applicationName: 'installed-app',
        applicationTitle: 'Installed app',
        name: 'stock',
        title: 'stock',
        remote: {
          name: 'installation-1',
          entry: 'https://installed-app-apps-publisher-org.sanity.run/mf-manifest.json',
        },
        moduleId: 'installation-1/views/stock/asset_source',
      },
    ])
  })

  it('drops applications whose origin cannot be resolved', () => {
    publish([
      application({
        id: 'no-origin',
        config: {mfManifest: {}} as ListedApplication['config'],
        activeDeployment: deployment([
          assetSourceInterface({name: 'picker', moduleId: 'views/picker'}),
        ]),
      }),
    ])

    expect(getCurrentFederatedAssetSourceViews()).toEqual([])
  })
})
