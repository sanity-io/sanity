/**
 * Prefix of every Content Agent bundle name, and of the version segment of the document ids
 * belonging to one.
 *
 * Lives in a module of its own so modules that only need the prefix do not pull in
 * `createAgentBundlesStore` and its rxjs/EventSource machinery.
 *
 * @internal
 */
export const AGENT_BUNDLE_PREFIX = 'agent-'
