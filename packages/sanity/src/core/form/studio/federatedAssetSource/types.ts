import {type FederationRemote} from '@sanity/sdk-react/dashboard'
import {
  type AssetFromSource,
  type AssetSourceComponentProps,
  type ValidationMarker,
} from '@sanity/types'

/**
 * The props the host passes to a mounted federated view: Studio's asset-source
 * component props plus source-agnostic host context. The view owns the whole
 * dialog body — browsing, selection state, its own confirm/cancel footer and
 * validation display — and completes a flow through the inherited
 * asset-source callbacks: `onSelect` with the final `AssetFromSource[]` (after
 * doing any source-side work such as linking, using its own credentials) and
 * `onClose`.
 *
 * Upload mode (`action: 'upload'`): the mount is headless (the Studio input
 * owns progress presentation) and the view drives the inherited `uploader`
 * prop directly per the `AssetSourceUploader` picker-mode contract — pending
 * files from `uploader.getFiles()`, progress and terminal statuses back
 * through `uploader.updateFile()`, aborts via `uploader.subscribe()`.
 * Ordering matters: once every file carries a terminal status the host fires
 * `all-complete`, which (synchronously, from the last status write) unsets
 * the field's `_upload` placeholder and tears the flow down. Where `onSelect`
 * goes relative to that depends on what it does:
 *
 * - Inserts that resolve immediately (`kind: 'assetDocumentId'`, e.g. the
 *   Media Library view linking already-uploaded assets): call `onSelect`
 *   *before* writing the last terminal status, so the flow is complete when
 *   the teardown runs.
 * - Inserts that start a dataset-side upload (`kind: 'file' | 'url' |
 *   'base64'`): write the terminal statuses *first*, then call `onSelect` —
 *   the dataset upload re-creates the `_upload` placeholder and writes to it
 *   asynchronously, so the teardown's unset must already have happened or it
 *   lands mid-flight and kills the insert. `onSelect` is a stable callback
 *   of the always-mounted input and stays valid after the teardown.
 *
 * In neither case may the view call `onClose` in upload mode. The
 * `all-complete` teardown performs the same reset as `onClose`, and
 * host-side subscribers (e.g. the Media Library's "asset already exists"
 * warning toasts, fed by `alreadyExists` statuses on the `all-complete`
 * event) must stay mounted until the terminal statuses land; closing first
 * silently drops them.
 *
 * Open-in-source mode (`action: 'openInSource'`): the host offers "Open in
 * source" on assets whose `source.name` matches the view's application name
 * (or the qualified `{applicationId}:{viewName}` source name) — so a view
 * that wants this flow must stamp `assetDocumentProps.source.name` with its
 * application name when inserting. What the stamp contains then decides the
 * flow per asset: a `source.url` makes the host open that URL directly in a
 * new tab (the external service's own page for the asset) and the view is
 * never mounted; without a `url` the view is remounted with the claimed
 * asset as `assetToOpen`, renders its own surface for it and finishes via
 * `onClose` (or switches to a fresh selection via `onChangeAction('select')`).
 *
 * Claim resolution happens on the dataset's asset document, which is
 * content-addressed (`image-{sha1}-…`) and therefore shared: uploading bytes
 * that already exist in the dataset returns the existing document, and the
 * `source` stamp only applies at creation. Provenance is first-writer-wins —
 * inserting an image via a brokered view when the identical bytes earlier
 * arrived via the Media Library (or any other source) reuses that document,
 * so "Open in source" keeps pointing at the original source. This is
 * intended: the reused document genuinely is that source's asset, and other
 * documents referencing it rely on its provenance staying put.
 *
 * Sources that need extra host context (e.g. the Media Library's `libraryId`
 * and plugin filters) extend this interface and pass the extras through the
 * hosting dialog's `extraViewProps`.
 *
 * @internal
 */
export interface FederatedAssetSourceViewProps extends AssetSourceComponentProps {
  /** The Studio's resolved color scheme, so the view matches the host theme. */
  scheme?: 'light' | 'dark'
  /** The hosting workspace's project id, for project-scoped source APIs. */
  projectId?: string
  /** The hosting workspace's dataset, for project-scoped source APIs. */
  dataset?: string
  /**
   * Opaque key partitioning view-side persistence (e.g. picker location) per
   * hosting workspace.
   */
  pickerPersistenceKey?: string
  /**
   * Validates the field value a candidate selection would produce against the
   * hosting field's schema rules. The view calls this on selection changes,
   * renders the returned markers and gates its own confirm control on
   * `level: 'error'` markers. A rejected promise means validation itself
   * failed — the view should fail open (keep the selection allowed) but log.
   *
   * Only provided for the Media Library view — a deliberate decision, not a
   * gap. Schema `media` rules validate the field's Media Library
   * global-document-reference (the validator fetches the library asset and
   * explicitly rejects values without that reference), so candidates from
   * third-party brokered sources have nothing those rules can resolve, and
   * documents they produce would fail such rules post-insert regardless.
   * Third-party views own their candidate gating themselves (e.g. the
   * `assetType`-based filtering); `undefined` here simply means no
   * host-side validation applies.
   */
  validateCandidate?: (selection: AssetFromSource[]) => Promise<ValidationMarker[]>
}

/**
 * The view contract version this Studio supports. The federated view artifact
 * exports its own `version`; a mismatch means the render contract may have
 * changed shape, so the host falls back to the iframe dialog instead of
 * mounting it.
 *
 * Keep in sync with `VIEW_CONTRACT_VERSION` in `@sanity/workbench-cli`.
 *
 * @internal
 */
export const SUPPORTED_VIEW_CONTRACT_VERSION = 1

/**
 * The handle returned by a federated view's `render()`.
 *
 * @internal
 */
export interface FederatedAssetSourceViewHandle {
  dispose: () => void
  setLifecycle?: (state: 'foreground' | 'background') => void
}

/**
 * The module shape of a federated `asset_source` view expose, as built by
 * `@sanity/workbench-cli` from `unstable_defineView('asset_source', …)`. The
 * artifact bundles all of its dependencies (empty federation share scope) and
 * owns a private React root under `rootElement`; calling `render()` again
 * with the same root element updates the mounted view's props in place.
 *
 * @internal
 */
export interface FederatedAssetSourceModule {
  render: (
    rootElement: HTMLElement,
    props: FederatedAssetSourceViewProps,
    renderOptions?: {reactStrictMode?: boolean},
  ) => FederatedAssetSourceViewHandle
  version: number
}

/**
 * A brokered federated asset-source view: where to register the remote and
 * which expose to load from it.
 *
 * @internal
 */
export interface FederatedAssetSourceRef {
  remote: FederationRemote
  moduleId: string
}

/**
 * A brokered `asset_source` view discovered on the workbench message bus,
 * carrying the publishing application's identity so a Studio asset source can
 * be named and titled from it.
 *
 * @internal
 */
export interface FederatedAssetSourceView extends FederatedAssetSourceRef {
  /** The publishing application's id — also the federation remote name. */
  applicationId: string
  /** Stable, immutable application identity (`ApplicationBase.name`). */
  applicationName: string
  /** Human-readable application title. */
  applicationTitle: string
  /** The view's name, unique within its application. */
  name: string
  /** Human-readable view title. */
  title: string
}
