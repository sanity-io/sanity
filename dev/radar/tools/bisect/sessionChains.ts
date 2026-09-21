/**
 * Refinement chains: a session can `refines` another — typically a
 * commit-granular bisect over the release a releases-only bisect blamed. The
 * chain is ONE regression, not several: the deepest verdict names the
 * commit, and annotations (regression flag, description, Linear issue, fix
 * release) made anywhere in the chain apply to it. Pure, so the Releases
 * attribution and the sessions list agree by construction.
 */
import {isSeverity, type Severity, worstSeverity} from './severity'

export interface ChainSession {
  _id: string
  refines: string | null
  createdAt: string | null
  description?: string | null
  result: {
    firstBadSha: string | null
    regression: boolean | null
    note?: string | null
    severity?: string | null
    linearIssue: string | null
    fixedIn: string | null
  } | null
}

export interface SessionChain<S extends ChainSession> {
  root: S
  /** The deepest session — the one still being worked on when unconverged. */
  leaf: S
  /** Root first. */
  sessions: S[]
}

/**
 * Group sessions into chains, one per root (a session that refines nothing,
 * or whose parent is gone — a dangling refinement stands on its own). From
 * each root the chain follows one refinement per level: a converged one over
 * an unconverged one (a verdict beats an attempt), newest first among equals.
 * Refinements not on that path are left out of the chain and are not roots
 * either — they are abandoned branches, visible in the sessions list but
 * never counted as a regression of their own.
 */
export function resolveSessionChains<S extends ChainSession>(sessions: S[]): SessionChain<S>[] {
  const byId = new Map(sessions.map((session) => [session._id, session]))
  const childrenOf = new Map<string, S[]>()
  for (const session of sessions) {
    if (!session.refines || !byId.has(session.refines) || session.refines === session._id) continue
    childrenOf.set(session.refines, [...(childrenOf.get(session.refines) ?? []), session])
  }
  const roots = sessions.filter(
    (session) => !session.refines || !byId.has(session.refines) || session.refines === session._id,
  )
  return roots.map((root) => {
    const chain = [root]
    const visited = new Set([root._id])
    let current = root
    for (;;) {
      const candidates = (childrenOf.get(current._id) ?? []).filter(
        (child) => !visited.has(child._id),
      )
      if (candidates.length === 0) break
      const converged = candidates.filter((child) => child.result?.firstBadSha)
      const next = (converged.length > 0 ? converged : candidates).toSorted((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
      )[0]
      chain.push(next)
      visited.add(next._id)
      current = next
    }
    return {root, leaf: chain.at(-1)!, sessions: chain}
  })
}

export interface ChainVerdict {
  /** The deepest converged session's first bad commit — undefined while nothing has converged. */
  firstBadSha?: string
  /** The session that verdict comes from. */
  verdictSessionId?: string
  /** Confirmed anywhere in the chain. */
  regression: boolean
  description?: string
  note?: string
  severity?: Severity
  linearIssue?: string
  fixedIn?: string
}

/**
 * What the chain says as a whole: the verdict of its deepest converged
 * session (a refinement in progress does not un-name the commit its parent
 * found), a regression if any session says so, the worst severity rated
 * anywhere in it (a union — the same regression may be rated on the parent
 * and on the refinement), and for each text annotation the deepest one set,
 * walking leaf to root.
 */
export function mergeChainVerdict<S extends ChainSession>(chain: SessionChain<S>): ChainVerdict {
  const leafFirst = chain.sessions.toReversed()
  const converged = leafFirst.find((session) => session.result?.firstBadSha)
  const first = (pick: (session: S) => string | null | undefined) => {
    for (const session of leafFirst) {
      const value = pick(session)
      if (value) return value
    }
    return undefined
  }
  return {
    firstBadSha: converged?.result?.firstBadSha ?? undefined,
    verdictSessionId: converged?._id,
    regression: chain.sessions.some((session) => session.result?.regression === true),
    description: first((session) => session.description),
    note: first((session) => session.result?.note),
    severity: worstSeverity(
      chain.sessions.map((session) => session.result?.severity).filter(isSeverity),
    ),
    linearIssue: first((session) => session.result?.linearIssue),
    fixedIn: first((session) => session.result?.fixedIn),
  }
}
