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
type InterfaceRecord = NonNullable<Deployment['interfaces']>[number]

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

function application(fields: {id: string} & Partial<ListedApplication>): ListedApplication {
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

function installation(fields: {id: string} & Partial<ListedInstallation>): ListedInstallation {
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
    const select = assetSourceInterface({name: 'select', moduleId: 'views/select'})
    publish([
      application({
        id: 'media-app',
        name: 'media-library',
        title: 'Media Library',
        externalUrl: 'https://media.example/path-is-ignored',
        config: {mfManifest: {}} as ListedApplication['config'],
        activeDeployment: deployment([
          select,
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
        interface: select,
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
    const picker = assetSourceInterface({name: 'picker', moduleId: 'views/picker/asset_source'})
    publish([
      {
        ...application({
          id: 'dev-app',
          name: 'example-asset-source',
          title: 'Example',
          externalUrl: 'http://localhost:3334',
          activeDeployment: deployment([picker]),
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
        interface: picker,
      },
    ])
    expect(views?.some(isMediaLibraryView)).toBe(false)
  })

  it('maps a third-party installation via its singleton origin', () => {
    const stock = assetSourceInterface({name: 'stock', moduleId: 'views/stock'})
    publish([
      installation({
        id: 'installation-1',
        interfaces: [stock],
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
          entry: 'https://installed-app--apps--publisher-org.sanity.run/mf-manifest.json',
        },
        moduleId: 'installation-1/views/stock/asset_source',
        interface: stock,
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

  describe('when an application is also served by a local dev server', () => {
    const localMediaLibrary = {
      ...application({
        id: 'local-media',
        type: 'coreApp',
        name: 'media-library',
        title: 'Media Library',
        externalUrl: 'http://localhost:3337',
        activeDeployment: deployment([
          assetSourceInterface({name: 'library', moduleId: 'views/library'}),
        ]),
      }),
      local: {host: 'localhost', port: 3337},
    } as ListedEntry

    const expectedLocalView = {
      applicationId: 'local-media',
      applicationName: 'media-library',
      applicationTitle: 'Media Library',
      name: 'library',
      title: 'library',
      remote: {name: 'local-media', entry: 'http://localhost:3337/mf-manifest.json'},
      moduleId: 'local-media/views/library/asset_source',
    }

    it('prefers the local dev server over an installation listed before it', () => {
      publish([
        installation({
          id: 'installed-media',
          application: {
            title: 'Media Library',
            name: 'media-library',
            reference: 'sanity/media-library',
            slug: 'media',
            icon: null,
            organizationId: 'org-1',
            config: {},
          },
          interfaces: [assetSourceInterface({name: 'library', moduleId: 'views/library'})],
        }),
        localMediaLibrary,
      ])

      expect(getCurrentFederatedAssetSourceViews()).toEqual([expectedLocalView])
    })

    it('prefers the local dev server over a deployed application listed after it', () => {
      publish([
        localMediaLibrary,
        application({
          id: 'deployed-media',
          type: 'coreApp',
          name: 'media-library',
          title: 'Media Library',
          externalUrl: 'https://media.example',
          config: {mfManifest: {}} as ListedApplication['config'],
          activeDeployment: deployment([
            assetSourceInterface({name: 'library', moduleId: 'views/library'}),
          ]),
        }),
      ])

      expect(getCurrentFederatedAssetSourceViews()).toEqual([expectedLocalView])
    })

    it('keeps deployed applications with a different name', () => {
      publish([
        localMediaLibrary,
        installation({
          id: 'installation-1',
          interfaces: [assetSourceInterface({name: 'stock', moduleId: 'views/stock'})],
        }),
      ])

      expect(getCurrentFederatedAssetSourceViews()?.map((view) => view.applicationId)).toEqual([
        'local-media',
        'installation-1',
      ])
    })
  })
})
