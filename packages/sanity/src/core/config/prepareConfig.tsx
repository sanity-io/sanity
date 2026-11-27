import {
  type ClientConfig as SanityClientConfig,
  createClient,
  type RequestHandler,
  type SanityClient,
} from '@sanity/client'
import {studioTheme} from '@sanity/ui'
import startCase from 'lodash-es/startCase.js'
import {type ComponentType, type ElementType, isValidElement} from 'react'
import {isValidElementType} from 'react-is'
import {defer, type Observable, of} from 'rxjs'
import {map, shareReplay, switchMap} from 'rxjs/operators'

import {prepareI18n} from '../i18n/i18nConfig'
import {resolveListenerCountingFetch} from '../network/listenerCount'
import {createLegacyAuthStore} from '../store/auth/legacy/createLegacyAuthStore'
import {createOAuthAuthStore} from '../store/auth/oauth/createOAuthAuthStore'
import {type AuthStore} from '../store/auth/types'
import {isAuthStore} from '../store/auth/utils/asserters'
import {type RequestFailureDiagnostics} from '../studio/requestErrors/diagnoseRequestFailure'
import {type StudioErrorHandler} from '../studio/requestErrors/types'
import {validateWorkspaces} from '../studio/workspaces/validateWorkspaces'
import {canonicalHash} from '../util/canonicalHash'
import {type AuthConfig} from './auth/types'
import {composeRequestHandlers} from './composeRequestHandlers'
import {ConfigResolutionError} from './ConfigResolutionError'
import {recordConfigWarning} from './configWarnings'
import {createDefaultIcon} from './createDefaultIcon'
import {
  getDefaultPluginsLocalePlugins,
  getDefaultPluginsOptions,
  isDefaultPluginIncluded,
} from './defaultPluginsOptions'
import {type resolveWorkspaceSource} from './resolveWorkspaceSource'
import {
  type Config,
  type MissingConfigFile,
  type PluginOptions,
  type PreparedConfig,
  type SingleWorkspace,
  type SourceOptions,
  type WorkspaceOptions,
  type WorkspaceSummary,
} from './types'

type InternalSource = WorkspaceSummary['__internal']['sources'][number]

const isBrowser = typeof window === 'object'

function normalizeIcon(
  Icon: ComponentType | ElementType | undefined,
  title: string,
  subtitle = '',
): React.JSX.Element {
  if (isValidElementType(Icon)) return <Icon />
  if (isValidElement(Icon)) return Icon
  return createDefaultIcon(title, subtitle)
}

const preparedWorkspaces = new WeakMap<SingleWorkspace | WorkspaceOptions, WorkspaceSummary>()

// Recorded here because inclusion depends on the root source's declared plugins, which the summary
// does not carry
const workspacesWithScheduledPublishing = new WeakSet<WorkspaceSummary>()

/**
 * Whether the workspace's root source loads the scheduled publishing plugin, as decided when the
 * source is resolved.
 *
 * @internal
 */
export function hasScheduledPublishingPlugin(workspace: WorkspaceSummary): boolean {
  return workspacesWithScheduledPublishing.has(workspace)
}

const warnedProjectAuthDivergence = new Set<string>()

/**
 * Detects when multiple workspaces declare different `auth` configurations
 * for the same projectId. Auth is project-scoped at runtime (cookies are
 * scoped to the API domain; tokens are stored by projectId in localStorage),
 * so per-workspace auth configs for the same project don't actually isolate
 * auth between workspaces — whichever workspace initializes first wins at
 * the storage level, and other configs become silent no-ops.
 *
 * Logs to the console and records the finding on the module-level warnings
 * list (see `configWarnings.ts`) so the studio UI can surface it in dev
 * mode via `ConfigIssuesButton`.
 *
 * @internal
 */
function warnOnDivergentProjectAuth(
  workspaces: ReadonlyArray<WorkspaceOptions | SingleWorkspace>,
): void {
  const byProject = new Map<string, Array<{name: string; auth: unknown}>>()
  for (const workspace of workspaces) {
    const {projectId, auth, name} = workspace as WorkspaceOptions & {auth?: unknown}
    if (!projectId || auth === undefined) continue
    // OAuth tokens are stored per project and OAuth client, so an OAuth workspace does not share
    // its session with the other workspaces of the project.
    if (!isAuthStore(auth) && (auth as AuthConfig | null)?.experimental_oauth) continue
    const list = byProject.get(projectId) ?? []
    list.push({name: name ?? 'default', auth})
    byProject.set(projectId, list)
  }

  for (const [projectId, entries] of byProject) {
    if (entries.length < 2) continue

    // Fingerprint each auth config so we can tell whether they diverge.
    // AuthStore instances (already-constructed) are compared by reference
    // identity; plain AuthConfig objects are compared by JSON shape.
    // `providers` can be a function — different function identities will
    // show as divergent, which may produce false positives but is acceptable
    // for a deprecation warning.
    const fingerprints = new Map<string, string[]>()
    for (const {name, auth} of entries) {
      const fingerprint = fingerprintAuth(auth)
      const names = fingerprints.get(fingerprint) ?? []
      names.push(name)
      fingerprints.set(fingerprint, names)
    }

    if (fingerprints.size < 2) continue

    // De-dupe across multiple prepareConfig runs in the same session
    // (HMR, tests, multiple studio instances).
    const warnKey = `${projectId}:${[...fingerprints.keys()].sort().join('|')}`
    if (warnedProjectAuthDivergence.has(warnKey)) continue
    warnedProjectAuthDivergence.add(warnKey)

    const groups = [...fingerprints.values()]
    const formattedGroups = groups.map((names) => `  • ${names.map((n) => `"${n}"`).join(', ')}`)
    const message =
      `Workspaces for project "${projectId}" declare different \`auth\` ` +
      `configurations. Auth is project-scoped: workspaces for the same project ` +
      `share cookies and tokens. Only the first-initialized workspace's \`auth\` ` +
      `config takes effect; others are silent no-ops. Consolidate these to a ` +
      `single shared config:\n${formattedGroups.join('\n')}`

    console.warn(`[sanity] ${message}`)
    recordConfigWarning({
      type: 'project-auth-divergence',
      projectId,
      groups,
      message,
    })
  }
}

function fingerprintAuth(auth: unknown): string {
  if (auth === null || typeof auth !== 'object') return String(auth)

  // Pre-built `AuthStore` instances are compared by reference identity.
  // `createLegacyAuthStore` is memoized by a canonical hash of its options, so two
  // `createLegacyAuthStore(equivalentOptions)` calls return the same instance —
  // meaning reference identity is sufficient to detect "same auth" even when
  // the calls were made separately per workspace.
  if (isAuthStore(auth)) return `AuthStore@${getObjectId(auth)}`

  // Plain `AuthConfig` objects are compared by canonical shape (keys sorted
  // recursively) so property declaration order doesn't produce false
  // positives.
  try {
    return `AuthConfig:${canonicalHash(auth)}`
  } catch {
    return `unserializable@${getObjectId(auth)}`
  }
}

const objectIds = new WeakMap<object, number>()
let nextObjectId = 1
function getObjectId(value: object): number {
  let id = objectIds.get(value)
  if (id === undefined) {
    id = nextObjectId++
    objectIds.set(value, id)
  }
  return id
}

/*
 * @FIXME: with the introduction of global references, @sanity/assist broke
 * As a quickfix the plugins was released with a know property on the plugin definition.
 * This checks for that property: if it is missing, the plugin is not compatible with this version of the studio.
 * This ensures auto updating studios can start, albeit without assist, it it is old.
 */
function filterIncompatiblePlugins(plugins: PluginOptions[]): PluginOptions[] {
  return plugins.filter((plugin) => {
    const validPlugin =
      plugin.name !== '@sanity/assist' || (plugin as unknown as {handlesGDR?: boolean}).handlesGDR
    if (!validPlugin) {
      console.warn(
        'Found an incompatible version of @sanity/assist plugin. It has been disabled.\n' +
          'To re-enable the plugin, please upgrade to https://github.com/sanity-io/assist/releases/tag/v3.2.2 or later.',
      )
    }

    return validPlugin
  })
}

let loadedResolveWorkspaceSource: typeof resolveWorkspaceSource | undefined

/**
 * Loads the code that resolves a source: the default plugins, the schema compiler and everything
 * they import, which the login screen does not need. Once loaded it emits synchronously, so
 * switching workspaces resolves the next one without a loading state.
 */
function loadResolveWorkspaceSource(): Observable<typeof resolveWorkspaceSource> {
  if (loadedResolveWorkspaceSource) return of(loadedResolveWorkspaceSource)
  return defer(() => import('./resolveWorkspaceSource')).pipe(
    map((module) => {
      loadedResolveWorkspaceSource = module.resolveWorkspaceSource
      return module.resolveWorkspaceSource
    }),
  )
}

/**
 * Starts loading the code that resolves a source before the first source is subscribed to, so
 * the fetch overlaps with loading the rest of the authenticated studio.
 *
 * @internal
 */
export function preloadWorkspaceSourceResolver(): void {
  void import('./resolveWorkspaceSource')
}

/**
 * Takes in a config (created from the `defineConfig` function) and returns
 * an array of `WorkspaceSummary`. Note: this only partially resolves a config.
 *
 * For usage inside the Studio, it's preferred to pull the pre-resolved
 * workspaces and sources via `useWorkspace` or `useSource`. For usage outside
 * the Studio or for testing, use `resolveConfig`.
 *
 * @internal
 */
export function prepareConfig(
  config: Config | MissingConfigFile,
  options?: {
    basePath?: string
    createStudioRequestHandler?: (
      getClient: () => SanityClient,
      getAuthStore?: () => AuthStore | undefined,
    ) => RequestHandler
    requestErrorChannel?: StudioErrorHandler
    requestFailureDiagnostics?: RequestFailureDiagnostics
  },
): PreparedConfig {
  if (!Array.isArray(config) && 'missingConfigFile' in config) {
    throw new ConfigResolutionError({
      name: '',
      type: 'configuration file',
      causes: ['No `sanity.config.ts` file found', 'No `sanity.config.js` file found'],
    })
  }

  const rootPath = getRootPath(options?.basePath)
  const workspaceOptions: WorkspaceOptions[] | [SingleWorkspace] = Array.isArray(config)
    ? config
    : [{...config, name: config.name ?? 'default'}]

  try {
    validateWorkspaces({workspaces: workspaceOptions})
  } catch (e) {
    throw new ConfigResolutionError({
      name: '',
      type: 'workspace',
      causes: [e.message],
    })
  }

  warnOnDivergentProjectAuth(workspaceOptions)

  const workspaces = workspaceOptions.map((rawWorkspace): WorkspaceSummary => {
    if (preparedWorkspaces.has(rawWorkspace)) {
      return preparedWorkspaces.get(rawWorkspace)!
    }
    const defaultPluginsOptions = getDefaultPluginsOptions(rawWorkspace)

    const {unstable_sources: nestedSources = [], ...rootSource} = rawWorkspace
    const sources = [rootSource as SourceOptions, ...nestedSources].map((source) => ({
      source: {...source, plugins: filterIncompatiblePlugins(source.plugins ?? [])},
      declaredPlugins: source.plugins,
    }))

    const resolvedSources = sources.map(
      ({source, declaredPlugins}, sourceIndex): InternalSource => {
        const auth = getAuthStore(source, {
          basePath: joinBasePath(rootPath, rootSource.basePath),
          createStudioRequestHandler: options?.createStudioRequestHandler,
          requestErrorChannel: options?.requestErrorChannel,
          requestFailureDiagnostics: options?.requestFailureDiagnostics,
        })
        // Deferred until the active workspace's login screen renders or the authenticated source
        // loads. The default plugins are only loaded with the source, so their locale bundles are
        // added here.
        const getI18n = createMemoizedGetter(() =>
          prepareI18n({
            ...source,
            plugins: [
              ...(source.plugins ?? []),
              ...getDefaultPluginsLocalePlugins(defaultPluginsOptions, declaredPlugins),
            ],
          }),
        )
        const source$ = loadResolveWorkspaceSource().pipe(
          switchMap((resolveWorkspaceSource) =>
            resolveWorkspaceSource({
              config: source,
              declaredPlugins,
              sourceIndex,
              workspaceName: rawWorkspace.name || 'default',
              defaultPluginsOptions,
              auth,
              i18n: getI18n(),
            }),
          ),
          shareReplay(1),
        )

        return {
          name: source.name,
          projectId: source.projectId,
          dataset: source.dataset,
          title: source.title || startCase(source.name),
          auth,
          get i18n() {
            return getI18n().source
          },
          get i18next() {
            return getI18n().i18next
          },
          source: source$,
        }
      },
    )

    const title = rootSource.title || startCase(rootSource.name)

    const workspaceSummary: WorkspaceSummary = {
      type: 'workspace-summary',
      auth: resolvedSources[0].auth,
      basePath: joinBasePath(rootPath, rootSource.basePath),
      dataset: rootSource.dataset,
      apiHost: rootSource.apiHost,
      get i18n() {
        return resolvedSources[0].i18n
      },
      customIcon: !!rootSource.icon,
      icon: normalizeIcon(rootSource.icon, title, `${rootSource.projectId} ${rootSource.dataset}`),
      name: rootSource.name || 'default',
      projectId: rootSource.projectId,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      theme: rootSource.theme || studioTheme,
      title,
      subtitle: rootSource.subtitle,
      hidden: rootSource.hidden,
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      __internal: {
        sources: resolvedSources,
      },
      ...defaultPluginsOptions,
    }
    if (
      isDefaultPluginIncluded(
        'sanity/scheduled-publishing',
        defaultPluginsOptions,
        sources[0].declaredPlugins,
      )
    ) {
      workspacesWithScheduledPublishing.add(workspaceSummary)
    }
    preparedWorkspaces.set(rawWorkspace, workspaceSummary)
    return workspaceSummary
  })

  return {type: 'prepared-config', workspaces}
}

type MemoizedResult<T> = {type: 'success'; value: T} | {type: 'failure'; error: unknown}

function createMemoizedGetter<T>(factory: () => T): () => T {
  let result: MemoizedResult<T> | undefined

  return function getMemoizedValue(): T {
    if (result?.type === 'success') return result.value
    if (result?.type === 'failure') throw result.error

    try {
      const value = factory()
      result = {type: 'success', value}
      return value
    } catch (error) {
      result = {type: 'failure', error}
      throw error
    }
  }
}

function getAuthStore(
  source: SourceOptions,
  {
    basePath,
    createStudioRequestHandler,
    requestErrorChannel,
    requestFailureDiagnostics,
  }: {
    /** The workspace base path, joined with the root path. */
    basePath: string
    createStudioRequestHandler?: (
      getClient: () => SanityClient,
      getAuthStore?: () => AuthStore | undefined,
    ) => RequestHandler
    requestErrorChannel?: StudioErrorHandler
    requestFailureDiagnostics?: RequestFailureDiagnostics
  },
): AuthStore {
  if (isAuthStore(source.auth)) {
    return source.auth
  }

  const clientFactory = source.unstable_clientFactory ?? createClient

  const {projectId, dataset, apiHost} = source
  // Set once the store is created below. Its clients are created by the store, so their request
  // handlers read it lazily.
  let authStore: AuthStore | undefined
  const authClientFactory = (config: SanityClientConfig) => {
    let client: SanityClient
    const studioRequestHandler = createStudioRequestHandler?.(
      () => client,
      () => authStore,
    )
    // A handler the auth store installs (the OAuth store renews its token on
    // an invalid session) runs inside the studio handler, closest to the
    // network, so the studio only sees the 401s that survive it.
    const authRequestHandler = config.requestHandler
    client = clientFactory({
      ...(isBrowser ? {resolveFetch: resolveListenerCountingFetch} : {}),
      ...config,
      ...(studioRequestHandler
        ? {requestHandler: composeRequestHandlers(studioRequestHandler, authRequestHandler)}
        : {}),
    })
    return client
  }

  if (source.auth?.experimental_oauth) {
    authStore = createOAuthAuthStore({
      apiHost: source.auth.apiHost ?? apiHost,
      ...source.auth.experimental_oauth,
      basePath,
      clientFactory: authClientFactory,
      getRequestErrorHandler: () => requestErrorChannel,
      getRequestFailureDiagnostics: () => requestFailureDiagnostics,
      dataset,
      projectId,
    })
    return authStore
  }

  authStore = createLegacyAuthStore({
    apiHost,
    ...source.auth,
    clientFactory: authClientFactory,
    // Passed as getters so this unhashable runtime wiring stays out of the
    // auth-store memo key.
    getRequestErrorHandler: () => requestErrorChannel,
    getRequestFailureDiagnostics: () => requestFailureDiagnostics,
    dataset,
    projectId,
  })
  return authStore
}

/**
 * Validate and normalize the `basePath` option.
 * The root path will be used to prepend workspace-specific base paths.
 * For instance, a `/studio` root path is joined with `/design` to become `/studio/design`.
 *
 * @param basePath - The base path to validate. If not set, an empty string will be returned.
 * @returns A normalized string
 * @throws ConfigResolutionError if the basePath is invalid
 * @internal
 */
function getRootPath(basePath?: string) {
  const rootPath = basePath || ''
  if (typeof rootPath !== 'string' || (rootPath.length > 0 && !rootPath.startsWith('/'))) {
    throw new ConfigResolutionError({
      name: '',
      type: 'options',
      causes: ['basePath must be a string, and must start with a slash'],
    })
  }

  // Since we'll be appending other base paths, we don't want to end up with double slashes
  return rootPath === '/' ? '' : rootPath
}

/**
 * Join the root path of the studio with a workspace base path
 *
 * @param rootPath - The root path to prepend to the base path
 * @param basePath - The base path of the workspace (can be empty)
 * @returns A normalized and joined, complete base path for a workspace
 * @internal
 */
function joinBasePath(rootPath: string, basePath?: string) {
  const joined = [rootPath, basePath || '']
    // Remove leading/trailing slashes
    .map((path) => path.replace(/^\/+/g, '').replace(/\/+$/g, ''))
    // Remove empty segments
    .filter(Boolean)
    // Join the segments
    .join('/')

  return `/${joined}`
}
