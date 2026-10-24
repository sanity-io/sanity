import {createSessionId} from '@sanity/telemetry'

/**
 * The telemetry session for this page load, shared by the batched store and by
 * session-level sampling decisions.
 *
 * @internal
 */
export const telemetrySessionId = createSessionId()
