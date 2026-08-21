import {type ClientPerspective} from '@sanity/client'

import {AGENT_BUNDLE_PREFIX} from '../../store/agent/createAgentBundlesStore'
import {VERSION_FOLDER} from '../../util/draftUtils'

const AGENT_VERSION_ID_PREFIX = `${VERSION_FOLDER}.${AGENT_BUNDLE_PREFIX}`

/**
 * GROQ clause that matches Content Agent version documents: path-based ids
 * (`versions.agent-*.<id>`) and opaque ids that carry an agent `_system.bundleId`.
 *
 * `defined()` is required before reading `_system.bundleId`: published and
 * classic draft documents leave it unset, `string::startsWith(null, …)` is
 * `null`, and `false || null` stays `null`. GROQ filters only keep `true`,
 * so a bare `startsWith` on that field would drop those documents from search.
 */
const IS_AGENT_VERSION_GROQ = `(string::startsWith(_id, "${AGENT_VERSION_ID_PREFIX}") || defined(_system.bundleId) && string::startsWith(_system.bundleId, "${AGENT_BUNDLE_PREFIX}"))`

/**
 * Filter used when searching with `perspective: 'raw'` so agent versions do not
 * appear as duplicate, often inaccessible hits.
 *
 * @internal
 */
export const EXCLUDE_AGENT_VERSIONS_GROQ = `!${IS_AGENT_VERSION_GROQ}`

/**
 * Agent versions are only readable by their author. `perspective: 'raw'` still
 * returns them as distinct hits, which show up as duplicate empty documents for
 * everyone else. Searching while an agent bundle is selected is unaffected:
 * that perspective rewrites `_id` to the published id, so this filter does not
 * apply.
 *
 * Own agent versions are also excluded. They still duplicate the published or
 * draft article in global search, and authors can open proposed changes from
 * the document itself.
 *
 * @internal
 */
export function getExcludeAgentVersionsFilter(
  perspective: ClientPerspective | undefined,
): string | undefined {
  if (perspective === 'raw') return EXCLUDE_AGENT_VERSIONS_GROQ
  if (Array.isArray(perspective) && perspective.includes('raw')) {
    return EXCLUDE_AGENT_VERSIONS_GROQ
  }
  return undefined
}
