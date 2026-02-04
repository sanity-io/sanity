import {createInstance} from '@module-federation/enhanced/runtime'
// oxlint-disable-next-line no-restricted-imports
import {createElement, use} from 'react'

// Initialize federation instance for the host
const federationInstance = createInstance({
  name: 'sanity:dev-host',
  remotes: [
    {
      name: '@sanity/orchestra',
      entry: 'https://mf-poc-orchestra.sanity.dev/static/remoteEntry.js',
      type: 'module',
      shareScope: 'default',
    },
  ],
  shared: {
    'react': {
      version: '19.2.0',
      scope: 'default',
      lib: () => import('react'),
      shareConfig: {
        singleton: true,
        requiredVersion: '^19.0.0',
      },
    },
    'react-dom': {
      version: '19.2.0',
      scope: 'default',
      lib: () => import('react-dom'),
      shareConfig: {
        singleton: true,
        requiredVersion: '^19.0.0',
      },
    },

    'sanity': {
      scope: 'default',
      shareConfig: {
        singleton: true,
        requiredVersion: '^5.0.0',
      },
    },
  },
})

// Cache for loaded remote component
let orchestraPromise: Promise<React.ComponentType<any>> | null = null

function loadOrchestraApp(): Promise<React.ComponentType<any>> {
  if (!orchestraPromise) {
    orchestraPromise = federationInstance
      .loadRemote<{default: React.ComponentType<any>}>('@sanity/orchestra/App')
      .then((module) => {
        if (!module) {
          throw new Error('Failed to load Orchestra remote module')
        }
        return module.default
      })
  }
  return orchestraPromise
}

// Orchestra loader component that uses React.use() for Suspense integration
export function Orchestra({
  localApplications,
}: {
  localApplications: Array<{
    port: number
    title: string
    remoteEntryUrl: string
  }>
}) {
  const OrchestraApp = use(loadOrchestraApp())
  return createElement(OrchestraApp, {localApplications})
}
