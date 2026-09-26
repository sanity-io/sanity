/**
 * Prefix for Content Agent bundle ids (`agent-<id>`) and version document ids
 * (`versions.agent-<id>.<publishedId>`).
 *
 * Kept in this leaf module so search can reuse it without importing the
 * agent-bundles store (rxjs + EventSource listener).
 *
 * @internal
 */
export const AGENT_BUNDLE_PREFIX = 'agent-'
