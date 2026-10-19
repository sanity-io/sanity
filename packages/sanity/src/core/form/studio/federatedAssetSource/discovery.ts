import {getApplicationOrigin} from '@sanity/sdk/_internal'
import {type DashboardTopics, type ValueOf} from '@sanity/sdk/dashboard'

import {getMessageBusConnection} from '../../../store/messageBus/getMessageBusConnection'
import {type FederatedAssetSourceView} from './types'

/**
 * The entries the workbench publishes on the `applications.list` state topic:
 * deployed applications, applications served by a CLI dev server, and
 * third-party installations. The SDK does not export the entry types by name,
 * so they are extracted from the topic declaration.
 */
type ApplicationsList = Extract<
  NonNullable<ValueOf<'applications.list', DashboardTopics>>,
  {ok: true}
>['value']

const MANIFEST_FILENAME = 'mf-manifest.json'
const ASSET_SOURCE_SLOT = 'asset_source'

/**
 * The stable, immutable identity (`ApplicationBase.name`) of Sanity's Media
 * Library application. Its brokered view replaces the select dialog of the
 * built-in Media Library asset source; views from any other application are
 * surfaced as additional asset sources.
 */
const MEDIA_LIBRARY_APPLICATION_NAME = 'media-library'

/** @internal */
export function isMediaLibraryView(view: FederatedAssetSourceView): boolean {
  return view.applicationName === MEDIA_LIBRARY_APPLICATION_NAME
}

/** The federation runtime loads remotes by manifest URL, not bare origin. */
function toManifestUrl(origin: string): string {
  if (origin.endsWith(MANIFEST_FILENAME)) return origin
  return new URL(MANIFEST_FILENAME, origin.endsWith('/') ? origin : `${origin}/`).href
}

/** The subset of a deployment's interface records the mapping reads. */
interface InterfaceRecord {
  moduleId: string
  name: string
  title: string
  type: string
}

function toViews(
  application: {id: string; name: string; title: string},
  origin: string | null,
  interfaces: readonly InterfaceRecord[] | null | undefined,
): FederatedAssetSourceView[] {
  if (origin === null) return []
  const views: FederatedAssetSourceView[] = []
  for (const extension of interfaces ?? []) {
    if (extension.type !== ASSET_SOURCE_SLOT) continue
    const moduleId = `${application.id}/${extension.moduleId}`
    views.push({
      applicationId: application.id,
      applicationName: application.name,
      applicationTitle: application.title,
      name: extension.name,
      title: extension.title,
      remote: {name: application.id, entry: toManifestUrl(origin)},
      // Deployed interface records carry `views/<name>`; the expose path adds
      // the component slot (`asset_source` is its only component).
      moduleId: moduleId.endsWith(`/${ASSET_SOURCE_SLOT}`)
        ? moduleId
        : `${moduleId}/${ASSET_SOURCE_SLOT}`,
    })
  }
  return views
}

/**
 * Every `asset_source` view among the published applications, mapped the same
 * way `useApplications()` in `@sanity/sdk-react` derives each view's loadable
 * module ref (which needs an SDK instance context the Studio does not have).
 */
function findAssetSourceViews(entries: ApplicationsList): FederatedAssetSourceView[] {
  return entries.flatMap((entry) => {
    if ('type' in entry) {
      // An application (`'studio' | 'coreApp'`), deployed or served locally.
      // Deployed interface records are only loadable once the application is
      // built with a federation manifest; local dev servers always are.
      const loadable = 'local' in entry || entry.config?.mfManifest !== undefined
      return toViews(
        entry,
        getApplicationOrigin(entry),
        loadable ? entry.activeDeployment?.interfaces : null,
      )
    }
    // A third-party installation: interfaces live on the record itself and
    // the origin derives from the installed application.
    const {application} = entry
    return toViews(
      {id: entry.id, name: application.name, title: application.title},
      getApplicationOrigin({
        externalUrl: null,
        slug: application.slug,
        isSingleton: true,
        organizationId: application.organizationId,
      }),
      entry.interfaces,
    )
  })
}

/**
 * The brokered `asset_source` views currently published by the workbench, or
 * `undefined` when the Studio is not running as a federated remote inside the
 * workbench (no message bus).
 *
 * Read synchronously off the bus's state topic because `prepareConfig`
 * resolves asset sources once: on a cold start in which the workbench has not
 * yet published `applications.list`, this returns `[]` — callers must resolve
 * that to today's iframe behavior, never to a missing Media Library source.
 *
 * @internal
 */
export function getCurrentFederatedAssetSourceViews(): FederatedAssetSourceView[] | undefined {
  const connection = getMessageBusConnection()
  if (!connection) return undefined
  const result = connection.subscribe('applications.list').getCurrent()
  return result?.ok ? findAssetSourceViews(result.value) : []
}
