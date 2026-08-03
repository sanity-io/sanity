/**
 * Storybook-safe port of `packages/sanity/test/testUtils/TestProvider.tsx`.
 *
 * Gives stories the full Studio context stack — `useSource()` / `useWorkspace()` /
 * i18n / perspective / router / resource cache — around a mock workspace built with
 * the real `createWorkspaceFromConfig` (so schema compilation, templates and config
 * resolution all run for real).
 *
 * Deviations from the test-util original, and why:
 * - No `vi.mock` (vitest is unavailable at Storybook runtime). The upsell providers
 *   (`DocumentLimitUpsellProvider` / `AssetLimitUpsellProvider`) were the only reason
 *   the original needed it, and no form-input story renders upsell UI — omitted.
 * - `ActiveWorkspaceMatcherProvider` omitted: it needs a `history` instance and this
 *   package doesn't depend on the `history` package. No form-input path reads it.
 *   Add it (plus the dep) when a navbar/workspace-switcher story needs it.
 * - The router is `route.intents('/intents')`, NOT `route.create('/')`: resolved-value
 *   reference previews render an `IntentLink` ("Open in new tab"), which throws at
 *   interaction time on a router without an intents route.
 * - The resource cache is a seeded, namespace-keyed stub (dependency identity is
 *   deliberately ignored — there is exactly one mock client in this world). Seeding
 *   `documentPreviewStore` here is what routes every preview/availability read to the
 *   fixture-backed mock store instead of a real API-connected store. `presenceStore`
 *   and `ReleasesStore` are seeded as inert mocks so `ReferencePreview`'s presence and
 *   version-status reads resolve without websockets or fetches.
 */
import {type ReleaseDocument, type SanityClient} from '@sanity/client'
import {
  type CurrentUser,
  type ObjectSchemaType,
  type Path,
  type SanityDocumentLike,
} from '@sanity/types'
import {LayerProvider, ToastProvider} from '@sanity/ui'
import {type Decorator} from '@storybook/react-vite'
import {type PropsWithChildren, type ReactNode, Suspense, use, useMemo} from 'react'
import {EMPTY, of} from 'rxjs'
import {
  ActiveWorkspaceMatcherContext,
  AddonDatasetContext,
  FormBuilderContext,
  PerspectiveContext,
  ResourceCacheContext,
  SingleDocReleaseContext,
  SingleDocReleaseEnabledContext,
  UserColorManagerContext,
} from 'sanity/_singletons'
import {route, RouterProvider} from 'sanity/router'

import {ResolvedPanesProvider} from '../../../packages/sanity/src/_singletons/context/ResolvedPanesContext'
import {ChangeIndicatorsTracker} from '../../../packages/sanity/src/core/changeIndicators/tracker'
import {createWorkspaceFromConfig} from '../../../packages/sanity/src/core/config/resolveConfig'
import {type SingleWorkspace, type Workspace} from '../../../packages/sanity/src/core/config/types'
import {FormValueProvider} from '../../../packages/sanity/src/core/form/contexts/FormValue'
import {GetFormValueProvider} from '../../../packages/sanity/src/core/form/contexts/GetFormValue'
import {type FormBuilderContextValue} from '../../../packages/sanity/src/core/form/FormBuilderContext'
import {createPatchChannel} from '../../../packages/sanity/src/core/form/patch/PatchChannel'
import {
  type ReferenceInputOptions,
  ReferenceInputOptionsProvider,
} from '../../../packages/sanity/src/core/form/studio/contexts/ReferenceInputOptions'
import {type RenderPreviewCallback} from '../../../packages/sanity/src/core/form/types'
import {LocaleProviderBase} from '../../../packages/sanity/src/core/i18n/components/LocaleProvider'
import {usEnglishLocale} from '../../../packages/sanity/src/core/i18n/locales'
import {type PerspectiveContextValue} from '../../../packages/sanity/src/core/perspective/types'
import {type DocumentPreviewStore} from '../../../packages/sanity/src/core/preview/documentPreviewStore'
import {type ReleaseStore} from '../../../packages/sanity/src/core/releases/store/types'
import {type GrantsStore} from '../../../packages/sanity/src/core/store/grants/types'
import {type PresenceStore} from '../../../packages/sanity/src/core/store/presence/presence-store'
import {type GlobalPresence} from '../../../packages/sanity/src/core/store/presence/types'
import {
  type ProjectGrants,
  type ProjectStore,
} from '../../../packages/sanity/src/core/store/project/types'
import {type ResourceCache} from '../../../packages/sanity/src/core/store/ResourceCacheProvider'
import {AppIdCacheProvider} from '../../../packages/sanity/src/core/store/studio-app/AppIdCacheProvider'
import {CopyPasteProvider} from '../../../packages/sanity/src/core/studio/copyPaste/CopyPasteProvider'
import {SourceProvider} from '../../../packages/sanity/src/core/studio/source'
import {WorkspaceProvider} from '../../../packages/sanity/src/core/studio/workspace'
import {createUserColorManager} from '../../../packages/sanity/src/core/user-color/manager'
import {type Panes} from '../../../packages/sanity/src/structure/structureResolvers/useResolvedPanes'
import {createMockSanityClient} from '../../../packages/sanity/test/mocks/mockSanityClient'
import {i18next} from './i18n'

const noop = () => undefined

const defaultMockUser: CurrentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  role: 'admin',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

const defaultMockConfig: SingleWorkspace = {
  projectId: 'mock-project-id',
  dataset: 'mock-data-set',
  schema: {
    name: 'mock',
    types: [
      {
        name: 'author',
        title: 'Author',
        type: 'document',
        fields: [{name: 'name', title: 'Name', type: 'string'}],
      },
    ],
  },
  scheduledPublishing: {enabled: false},
  releases: {enabled: true},
  mediaLibrary: {enabled: true},
}

// Inline port of `perspectiveContextValueMock` (its source module imports vitest types).
const perspectiveValue: PerspectiveContextValue = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts',
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts',
}

const resolvedPanes: Panes = {
  paneDataItems: [],
  routerPanes: [],
  resolvedPanes: [],
  focusedPane: null,
  setFocusedPane: noop,
}

const addonDatasetValue = {
  createAddonDataset: async () => Promise.resolve(null),
  isCreatingDataset: false,
  client: null,
  ready: true,
}

/**
 * Fixture presence: three collaborators in the studio, each in a different document, so the
 * navbar's PresenceMenu has a real room to show rather than an empty one. `status` covers the
 * three states the avatars tone by (`online`, `editing`, `inactive`).
 */
export const fixtureGlobalPresence: GlobalPresence[] = [
  {
    user: {id: 'p-ada', displayName: 'Ada Okafor', email: 'ada@example.com'},
    status: 'editing',
    lastActiveAt: new Date().toISOString(),
    locations: [
      {
        type: 'document',
        documentId: 'article-launch',
        lastActiveAt: new Date().toISOString(),
        path: ['title'],
      },
    ],
  },
  {
    user: {id: 'p-bo', displayName: 'Bo Lindqvist', email: 'bo@example.com'},
    status: 'online',
    lastActiveAt: new Date().toISOString(),
    locations: [
      {
        type: 'document',
        documentId: 'article-pricing',
        lastActiveAt: new Date().toISOString(),
        path: ['body'],
      },
    ],
  },
  {
    user: {id: 'p-mira', displayName: 'Mira Haddad', email: 'mira@example.com'},
    status: 'inactive',
    lastActiveAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    locations: [],
  },
]

function createMockPresenceStore(presence: GlobalPresence[]): PresenceStore {
  return {
    documentPresence: () => of([]),
    globalPresence$: of(presence),
    reportLocations: () => of(undefined),
    setLocation: noop,
    debugPresenceParam$: of([]),
  }
}

const mockPresenceStore = createMockPresenceStore([])

/**
 * Mock project store. `useProjectStore()` resolves out of the resource cache first
 * (`resourceCache.get({namespace: 'projectStore'}) || createProjectStore(...)`), so seeding this
 * namespace keeps the real store — and its live HTTP calls — out of the storybook entirely.
 *
 * This matters more than it looks. `useCanInviteProjectMembers` (PresenceMenu, ManageMenu) fetches
 * `/projects/:id/grants` and then reads `grants['sanity.project.members']`. With no backend the
 * response is null and the read throws — but only ON OPEN, because the hook is gated on
 * `enabled: open`. That is exactly why a render-only QA pass declared the story healthy and the
 * first human to click it got a crash. Seeding the store closes the hole at the source.
 */
function createMockProjectStore(opts: {canInviteMembers: boolean}): ProjectStore {
  const grants: ProjectGrants = opts.canInviteMembers
    ? {
        'sanity.project.members': [
          {
            id: 'administrator',
            name: 'administrator',
            title: 'Administrator',
            description: null,
            isCustom: false,
            config: {},
            grants: [{name: 'invite', params: {}}],
          },
        ],
      }
    : {}
  return {
    get: () => of({} as never),
    getDatasets: () => of([] as never),
    getGrants: () => of(grants),
    getOrganizationData: () => of(null),
    getOrganizationId: () => of(null),
  }
}

/**
 * Mock grants store.
 *
 * `useGrantsStore()` resolves out of the resource cache first, then falls back to
 * `createGrantsStore({client, userId, errorHandler})`, which issues real permission requests. With
 * no backend those never resolve, so anything downstream of them sits in a permanent loading
 * state rather than failing visibly, which is the worst of the three outcomes: a story that looks
 * like it renders and is actually stuck.
 *
 * The consumer that matters here is `useTemplatePermissions`, which every "create new document"
 * affordance depends on: `PaneHeaderCreateButton`, `NewDocumentButton`, the structure pane's own
 * create menu. Each of them has a distinct "you may not create this" branch that could not be
 * reached from a story at all before this existed.
 *
 * The contract is one method wide (`checkDocumentPermission` returning an observable of
 * `{granted, reason}`), so a blanket yes or no is the whole surface. Per-type permissions would
 * need a predicate here, which no story has needed yet.
 */
function createMockGrantsStore(granted: boolean): GrantsStore {
  return {
    checkDocumentPermission: () =>
      of({
        granted,
        reason: granted ? '' : 'No matching grants found for this document type',
      }),
  }
}

function createMockReleaseStore(releases: ReleaseDocument[]): ReleaseStore {
  return {
    state$: of({
      releases: new Map(releases.map((release) => [release._id, release])),
      state: 'loaded' as const,
    }),
    errorCount$: of(releases.filter((release) => release.error).length),
    getMetadataStateForSlugs$: () => of({data: null, error: null, loading: false}),
    dispatch: noop,
  }
}

// Default: inert (no releases) — existing stories keep rendering exactly as before.
const mockReleaseStore = createMockReleaseStore([])

/**
 * `useReleasePermissions` resolves out of the resource cache under its own namespace before it
 * would build a real store, exactly as `useReleasesStore` does — so seeding it here short-circuits
 * a live permissions request that would otherwise fire the moment a release action is rendered.
 *
 * The interesting parameter is `allowed`. Every release CTA and menu item asks
 * `checkWithPermissionGuard(action, args)` and renders a disabled control with an explanatory
 * tooltip when the answer is no. That branch is unreachable in a storybook without this seam, and
 * it is the branch most likely to be wrong in production: an editor without release permissions
 * sees a different interface from the one anybody builds against.
 */
function createMockReleasePermissionsStore(allowed: boolean) {
  return {
    checkWithPermissionGuard: async () => allowed,
    permissions: {},
  }
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Fixture releases covering the three release types the DocumentStatus family tones
 * by (`metadata.releaseType`): `asap`, `scheduled` (with a publish date), and
 * `undecided`. Ids follow the `_.releases.<releaseId>` convention that
 * `getReleaseIdFromReleaseDocumentId` parses — the `versions` prop passed to
 * `DocumentStatus`/`DocumentStatusIndicator` must be keyed by those release ids
 * (`rAsap` / `rScheduled` / `rUndecided`). States are non-archived so
 * `useActiveReleases` keeps them.
 */
export const fixtureReleases: ReleaseDocument[] = [
  {
    _id: '_.releases.rAsap',
    name: 'rAsap',
    _type: 'system.release',
    _rev: 'rev-release-asap',
    _createdAt: new Date(Date.now() - 2 * DAY_MS).toISOString(),
    _updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    state: 'active',
    metadata: {title: 'Hotfix launch', releaseType: 'asap'},
  },
  {
    _id: '_.releases.rScheduled',
    name: 'rScheduled',
    _type: 'system.release',
    _rev: 'rev-release-scheduled',
    _createdAt: new Date(Date.now() - 5 * DAY_MS).toISOString(),
    _updatedAt: new Date(Date.now() - DAY_MS).toISOString(),
    state: 'scheduled',
    publishAt: new Date(Date.now() + 2 * DAY_MS).toISOString(),
    metadata: {
      title: 'Spring campaign',
      releaseType: 'scheduled',
      intendedPublishAt: new Date(Date.now() + 2 * DAY_MS).toISOString(),
    },
  },
  {
    _id: '_.releases.rUndecided',
    name: 'rUndecided',
    _type: 'system.release',
    _rev: 'rev-release-undecided',
    _createdAt: new Date(Date.now() - 10 * DAY_MS).toISOString(),
    _updatedAt: new Date(Date.now() - 3 * DAY_MS).toISOString(),
    state: 'active',
    metadata: {title: 'Someday ideas', releaseType: 'undecided'},
  },
]

function createSeededResourceCache(seed: Record<string, unknown>): ResourceCache {
  const values = new Map<string, unknown>(Object.entries(seed))
  return {
    get: <T,>({namespace}: {namespace: string}) => values.get(namespace) as T | undefined,
    set: ({namespace, value}) => {
      // Seeded namespaces win; anything else may self-register as usual.
      if (!values.has(namespace)) values.set(namespace, value)
    },
  }
}

export interface StudioProvidersOptions {
  /** Merged over the default mock workspace config (schema types, project id, …). */
  config?: Partial<SingleWorkspace>
  client?: SanityClient
  /** Seeded into the resource cache so `useDocumentPreviewStore()` resolves it. */
  previewStore?: DocumentPreviewStore
  /**
   * Active releases to seed the releases store with (e.g. {@link fixtureReleases}), so
   * `useActiveReleases()` consumers — the DocumentStatus family's version rows/dots —
   * render live. Omit for the default inert (empty) store.
   */
  releases?: ReleaseDocument[]
  /**
   * Collaborators to seed global presence with (e.g. {@link fixtureGlobalPresence}), so the
   * navbar's PresenceMenu shows a populated room. Omit for the default empty studio.
   */
  presence?: GlobalPresence[]
  /**
   * Whether the seeded project store reports the `invite` grant, which decides if
   * `useCanInviteProjectMembers` consumers (PresenceMenu, ManageMenu) offer "Invite members".
   * Defaults to `true`. Either way, a store IS seeded, so the live grants request never fires.
   */
  canInviteMembers?: boolean
  /**
   * Whether release actions are permitted. Drives the disabled-with-tooltip branch of every
   * release CTA and menu item (`CreateReleaseMenuItem`, the publish/schedule/revert buttons).
   * Defaults to `true`. Either way a store IS seeded, so no live permissions request fires.
   */
  canPerformReleaseActions?: boolean
  /**
   * Whether the user may create documents. Drives every "create new" affordance that consults
   * `useTemplatePermissions`: the pane header's create button, the navbar's new-document list,
   * and their disabled-with-explanation branches. Defaults to `true`. Either way a store IS
   * seeded, so no live permission request fires and nothing hangs waiting for one.
   */
  canCreateDocuments?: boolean
}

interface HarnessValue {
  workspace: Workspace
  resourceCache: ResourceCache
}

function createHarness(options: StudioProvidersOptions): Promise<HarnessValue> {
  // `createMockSanityClient` has no `live` API, and several surfaces subscribe to it -
  // `SharePreviewMenu` calls `client.live.events()` and throws on `undefined`. An empty event
  // stream is a legitimate state (nothing has happened yet), so attach one rather than making
  // every story that renders a live-aware component supply its own client.
  const client = options.client ?? (createMockSanityClient() as unknown as SanityClient)
  // Attach IN PLACE rather than on a copy. The mock's `withConfig: () => mockClient` hands back
  // the original object, so a wrapped copy is discarded the moment anything calls `useClient()` -
  // which is every consumer. Mutating the instance is the only version that survives that.
  if (!(client as unknown as {live?: unknown}).live) {
    Object.assign(client, {live: {events: () => EMPTY}})
  }
  // Same reasoning, different method. `getDocumentExistence` calls `client.getDataUrl(...)`
  // synchronously and unconditionally, and the mock does not implement it, so every story that
  // reaches a cross-dataset reference lookup throws before rendering anything. The URL is only
  // used to build a request the mock intercepts anyway, so a plausible shape is enough.
  if (!(client as unknown as {getDataUrl?: unknown}).getDataUrl) {
    Object.assign(client, {
      getDataUrl: (operation: string, path?: string) =>
        `/data/${operation}/${defaultMockConfig.dataset}/${path ?? ''}`,
    })
  }
  const getClient = () => client
  return createWorkspaceFromConfig({
    ...defaultMockConfig,
    ...options.config,
    currentUser: defaultMockUser,
    getClient,
  }).then((workspace) => ({
    workspace,
    resourceCache: createSeededResourceCache({
      ...(options.previewStore ? {documentPreviewStore: options.previewStore} : {}),
      presenceStore: options.presence
        ? createMockPresenceStore(options.presence)
        : mockPresenceStore,
      projectStore: createMockProjectStore({canInviteMembers: options.canInviteMembers ?? true}),
      ReleasesStore: options.releases ? createMockReleaseStore(options.releases) : mockReleaseStore,
      ReleasePermissions: createMockReleasePermissionsStore(
        options.canPerformReleaseActions ?? true,
      ),
      grantsStore: createMockGrantsStore(options.canCreateDocuments ?? true),
    }),
  }))
}

const userColorManager = createUserColorManager({scheme: 'dark'})

const singleDocReleaseValue = {onSetScheduledDraftPerspective: noop}
const singleDocReleaseEnabledValue = {enabled: true, mode: 'default' as const}

const router = route.intents('/intents')
const routerState = {}
const locales = [usEnglishLocale]

function StudioProvidersInner(props: PropsWithChildren<{harness: Promise<HarnessValue>}>) {
  const {workspace, resourceCache} = use(props.harness)

  return (
    <RouterProvider router={router} state={routerState} onNavigate={noop}>
      <LocaleProviderBase
        locales={locales}
        i18next={i18next}
        projectId="storybook"
        sourceId="storybook"
      >
        {/* `useActiveWorkspace()` THROWS when this context is missing, and the components that
            reach for it are not the ones you would guess: the field-diff change list wants it, and
            so does the not-authorized screen. Mounting the real `ActiveWorkspaceMatcher` would drag
            in a router, a config resolver and a live auth flow to supply a value the harness has
            already built, so the workspace is seeded directly as the active one. Seeding the VALUE
            rather than the provider is the standing pattern here. */}
        {/* Diff annotations, presence dots and avatars are coloured PER USER, and every one of
            them resolves that colour through this manager. `useUserColorManager()` throws without
            it, which is how the field-diff stories found it. Scheme-fixed to dark: the hues stay
            legible in both themes, and a manager that changed identity on theme toggle would
            recolour every author mid-session. */}
        {/* Two scheduled-draft contexts, both of which THROW when absent and neither of which is
            reachable from anything a story would think to seed. `useSingleDocRelease` is called by
            the version chips; `useSingleDocReleaseEnabled` gates the scheduled-drafts empty state
            and upsell. Their real providers want a feature-flag request and a perspective setter,
            so the values are supplied directly. `mode: 'default'` means "enabled, not upselling",
            which is the state almost every story wants. */}
        <SingleDocReleaseContext.Provider value={singleDocReleaseValue}>
          <SingleDocReleaseEnabledContext.Provider value={singleDocReleaseEnabledValue}>
            <UserColorManagerContext.Provider value={userColorManager}>
              <ActiveWorkspaceMatcherContext.Provider
                // oxlint-disable-next-line no-unsafe-type-assertion -- a Workspace satisfies every field
                // of WorkspaceSummary that a consumer of this context actually reads.
                value={{activeWorkspace: workspace as never, setActiveWorkspace: noop}}
              >
                <ResourceCacheContext.Provider value={resourceCache}>
                  <ToastProvider>
                    <LayerProvider>
                      <WorkspaceProvider workspace={workspace}>
                        <SourceProvider source={workspace.unstable_sources[0]}>
                          <ResolvedPanesProvider value={resolvedPanes}>
                            <CopyPasteProvider>
                              {/* The real `StudioProvider` mounts this unconditionally and it
                                  needs no configuration: it creates its own cache when there is
                                  no parent. Without it `useAppIdCache()` throws, which is how
                                  four release header stories rendered empty. */}
                              <AppIdCacheProvider>
                                <AddonDatasetContext.Provider value={addonDatasetValue}>
                                  <PerspectiveContext.Provider value={perspectiveValue}>
                                    {props.children}
                                  </PerspectiveContext.Provider>
                                </AddonDatasetContext.Provider>
                              </AppIdCacheProvider>
                            </CopyPasteProvider>
                          </ResolvedPanesProvider>
                        </SourceProvider>
                      </WorkspaceProvider>
                    </LayerProvider>
                  </ToastProvider>
                </ResourceCacheContext.Provider>
              </ActiveWorkspaceMatcherContext.Provider>
            </UserColorManagerContext.Provider>
          </SingleDocReleaseEnabledContext.Provider>
        </SingleDocReleaseContext.Provider>
      </LocaleProviderBase>
    </RouterProvider>
  )
}

/**
 * Story-level decorator factory. NOT wired into `.storybook/preview.tsx` on purpose:
 * building the workspace compiles a schema and mounts ~10 providers, and Phase B
 * ui-components stories must not pay for (or risk breaking on) any of it. Use it
 * per story file:
 *
 * ```ts
 * const meta = {decorators: [WithStudioProviders({config, previewStore})], ...}
 * ```
 *
 * The workspace is created once per factory call (module scope of the story file)
 * and shared by every story in the file.
 */
export function WithStudioProviders(options: StudioProvidersOptions = {}): Decorator {
  let harness: Promise<HarnessValue> | undefined
  return (Story) => (
    <Suspense fallback={null}>
      <StudioProvidersInner harness={(harness ??= createHarness(options))}>
        <Story />
      </StudioProvidersInner>
    </Suspense>
  )
}

export interface FormStubProps {
  /** The document being "edited" — `useFormValue([])` reads `_type` off this. */
  documentValue: SanityDocumentLike
  /** Schema type of the host document. */
  documentType: ObjectSchemaType
  renderPreview: RenderPreviewCallback
  focusPath?: Path
  /**
   * Reference-input options context. Without a provider the context defaults to `{}`
   * and `EditReferenceLinkComponent` is undefined — in which case the resolved-value
   * preview card renders `null` silently (the card's `as` component returns null).
   * Pass at least an `EditReferenceLinkComponent` for any story showing a value.
   */
  referenceInputOptions?: ReferenceInputOptions
  children: ReactNode
}

/**
 * The minimal form-layer context stack a bare form input (rendered outside a real
 * `FormBuilder`) needs: form value (`useFormValue` AND `useGetFormValue`, both seeded
 * from `documentValue` — SlugInput's Generate button reads the latter and throws
 * without it), a stub `FormBuilderContext` (only `focusPath`, `renderPreview` and the
 * patch channel are read in input render paths), a `ChangeIndicatorsTracker` (the
 * change-bar reporter inside inputs like DateTimeInput warns once per mount without
 * one; the tracker is context-only and renders nothing), and the reference-input
 * options context. For REAL resolved form members (array item rows, per-item
 * validation) use `FormBuilderHarness` from `lib/formBuilderHarness.tsx` instead.
 */
export function FormStub(props: FormStubProps) {
  const {
    documentValue,
    documentType,
    renderPreview,
    focusPath = [],
    referenceInputOptions,
    children,
  } = props

  const formBuilder = useMemo(
    (): FormBuilderContextValue => ({
      __internal: {
        components: {
          CustomMarkers: (() =>
            null) as unknown as FormBuilderContextValue['__internal']['components']['CustomMarkers'],
          Markers: (() =>
            null) as unknown as FormBuilderContextValue['__internal']['components']['Markers'],
        },
        file: {assetSources: [], directUploads: false},
        filterField: () => true,
        image: {assetSources: [], directUploads: false},
        patchChannel: createPatchChannel(),
      },
      collapsedFieldSets: undefined,
      collapsedPaths: undefined,
      focusPath,
      groups: [],
      id: 'storybook-form',
      renderField: () => null,
      renderInput: () => null,
      renderItem: () => null,
      renderPreview,
      schemaType: documentType,
    }),
    [documentType, focusPath, renderPreview],
  )

  const formDocumentValue = documentValue as Parameters<typeof FormValueProvider>[0]['value']

  const content = (
    <FormValueProvider value={formDocumentValue}>
      <GetFormValueProvider value={formDocumentValue}>
        <ChangeIndicatorsTracker>
          <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
        </ChangeIndicatorsTracker>
      </GetFormValueProvider>
    </FormValueProvider>
  )

  return referenceInputOptions ? (
    <ReferenceInputOptionsProvider {...referenceInputOptions}>
      {content}
    </ReferenceInputOptionsProvider>
  ) : (
    content
  )
}
