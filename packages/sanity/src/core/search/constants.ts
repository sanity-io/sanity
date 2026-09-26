import {AGENT_BUNDLE_PREFIX} from '../store/agent/createAgentBundlesStore'
import {VERSION_FOLDER} from '../util/draftUtils'

// Findability version, prepended to every search query for future measurement
export const FINDABILITY_MVI = 4

/**
 * GROQ constraint matching every document except Content Agent versions, identified by a
 * `versions.agent-*.*` id or by an agent `_system.bundleId` (variant-scoped versions carry the
 * bundle in `_system` because their ids use opaque scope hashes).
 *
 * `_system.bundleId` is unset on most documents, and `string::startsWith(null, …)` returns
 * `null` — which would poison the negation under GROQ's three-valued logic (`!(false || null)`
 * is `null`, and filters only keep `true`). Comparing with `== true` keeps the clause boolean.
 *
 * @internal
 */
export const EXCLUDE_AGENT_VERSIONS_FILTER = `!(string::startsWith(_id, "${VERSION_FOLDER}.${AGENT_BUNDLE_PREFIX}") || string::startsWith(_system.bundleId, "${AGENT_BUNDLE_PREFIX}") == true)`
