import {ClientError} from '@sanity/client'
import {act, render, screen, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {type Config, type WorkspaceSummary} from '../../../config/types'
import {type AuthStore} from '../../../store/auth/types'
import type * as RequestErrorChannelModule from '../../requestErrors/createRequestErrorChannel'
import {WorkspacesProvider} from '../WorkspacesProvider'

const harness = vi.hoisted(() => ({
  workspaces: [] as WorkspaceSummary[],
  // Set before render so the claim lands in the channel's BehaviorSubject
  // during the useState initializer, before WorkspacesClaimProvider mounts.
  claimProjectId: undefined as string | undefined,
  // The auth store of the client that got the invalid session, when the claim names one.
  claimAuthStore: undefined as AuthStore | undefined,
  onRequestFailure: undefined as
    | ((
        result: {type: 'cors'; allowed: boolean; withCredentials: boolean},
        client: {config: () => {projectId?: string; apiHost?: string; dataset?: string}},
      ) => void)
    | undefined,
  corsOnResolved: undefined as (() => void) | undefined,
}))

vi.mock('../../../config/prepareConfig', () => ({
  prepareConfig: (
    _config: unknown,
    options?: {
      requestFailureDiagnostics?: {
        onRequestFailure: NonNullable<(typeof harness)['onRequestFailure']>
      }
    },
  ) => {
    harness.onRequestFailure = options?.requestFailureDiagnostics?.onRequestFailure
    return {workspaces: harness.workspaces}
  },
}))

vi.mock('../CorsOriginErrorView', () => ({
  CorsOriginErrorView: (props: {onResolved: () => void}) => {
    harness.corsOnResolved = props.onResolved
    return <div>cors</div>
  },
}))

vi.mock('../../requestErrors/createRequestErrorChannel', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof RequestErrorChannelModule
  return {
    ...actual,
    createRequestErrorChannel: () => {
      const channel = actual.createRequestErrorChannel()
      const projectId = harness.claimProjectId
      if (projectId) {
        // `handle` claims synchronously before its first await, so the
        // unauthorized claim is already current when the provider mounts.
        const authStore = harness.claimAuthStore
        void channel.handle(invalidSessionError(projectId), authStore ? {authStore} : undefined)
      }
      return channel
    },
  }
})

function invalidSessionError(projectId: string): ClientError {
  return new ClientError({
    statusCode: 401,
    headers: {},
    body: {error: 'Unauthorized', errorCode: 'SIO-401-ANF'},
    url: `https://${projectId}.api.sanity.io/v2021-06-07/users/me`,
    method: 'GET',
  } as never)
}

type SourceEntry = WorkspaceSummary['__internal']['sources'][number]

function source(projectId: string, logout: () => Promise<void>): SourceEntry {
  return {projectId, auth: {logout} as AuthStore} as SourceEntry
}

function workspace(
  projectId: string,
  logout: () => Promise<void>,
  nestedSources: SourceEntry[] = [],
): WorkspaceSummary {
  const root = source(projectId, logout)
  return {
    projectId,
    auth: root.auth,
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    __internal: {sources: [root, ...nestedSources]},
  } as WorkspaceSummary
}

function renderProvider() {
  return render(
    <WorkspacesProvider
      config={{} as Config}
      LoadingComponent={() => <div>loading</div>}
      basePath="/"
    >
      <div>ready</div>
    </WorkspacesProvider>,
  )
}

describe('WorkspacesProvider forced logout', () => {
  it('logs out the matching workspace once when the unauthorized claim arrives before the claim provider mounts', async () => {
    const matchingLogout = vi.fn(() => Promise.resolve())
    const otherLogout = vi.fn(() => Promise.resolve())
    harness.workspaces = [workspace('otherproj', otherLogout), workspace('proja', matchingLogout)]
    harness.claimProjectId = 'proja'

    const view = renderProvider()

    await waitFor(() => expect(matchingLogout).toHaveBeenCalledTimes(1))
    expect(otherLogout).not.toHaveBeenCalled()
    expect(screen.getByText('ready')).toBeInTheDocument()

    // A new workspace-list identity must not fire logout again. The effect
    // depends only on the claim; the list is read through useEffectEvent.
    // `rerender` flushes the commit, so a second logout would already have run.
    harness.workspaces = harness.workspaces.map((ws) => ({...ws}))
    view.rerender(
      <WorkspacesProvider
        config={{name: 'rerender'} as Config}
        LoadingComponent={() => <div>loading</div>}
        basePath="/"
      >
        <div>ready</div>
      </WorkspacesProvider>,
    )
    expect(matchingLogout).toHaveBeenCalledTimes(1)
  })

  it('logs out the auth store named on the claim, not the first workspace of the project', async () => {
    // An OAuth workspace keeps its own session next to the legacy workspaces of the same project.
    const legacyLogout = vi.fn(() => Promise.resolve())
    const oauthLogout = vi.fn(() => Promise.resolve())
    const oauthWorkspace = workspace('proja', oauthLogout)
    harness.workspaces = [workspace('proja', legacyLogout), oauthWorkspace]
    harness.claimProjectId = 'proja'
    harness.claimAuthStore = oauthWorkspace.auth

    renderProvider()

    await waitFor(() => expect(oauthLogout).toHaveBeenCalledTimes(1))
    expect(legacyLogout).not.toHaveBeenCalled()
    harness.claimAuthStore = undefined
  })

  it('logs out a nested source whose project differs from every root workspace', async () => {
    const rootLogout = vi.fn(() => Promise.resolve())
    const nestedLogout = vi.fn(() => Promise.resolve())
    harness.workspaces = [workspace('rootproj', rootLogout, [source('nestedproj', nestedLogout)])]
    harness.claimProjectId = 'nestedproj'

    renderProvider()

    await waitFor(() => expect(nestedLogout).toHaveBeenCalledTimes(1))
    expect(rootLogout).not.toHaveBeenCalled()
  })

  it('does not log out again when a CORS takeover unmounts and remounts the claim provider', async () => {
    const logout = vi.fn(() => Promise.resolve())
    harness.workspaces = [workspace('proja', logout)]
    harness.claimProjectId = 'proja'

    renderProvider()
    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1))

    await act(async () => {
      harness.onRequestFailure?.(
        {type: 'cors', allowed: false, withCredentials: false},
        {config: () => ({projectId: 'proja', dataset: 'test'})},
      )
    })
    expect(screen.getByText('cors')).toBeInTheDocument()

    await act(async () => {
      harness.corsOnResolved?.()
    })
    expect(screen.getByText('ready')).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
  })
})
