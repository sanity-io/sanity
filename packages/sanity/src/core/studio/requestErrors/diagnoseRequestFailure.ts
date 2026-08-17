import {type SanityClient} from '@sanity/client'

import {checkCors, type CorsCheckCache} from '../workspaces/corsCheck'
import {classifyConfigError, isNetworkError, isTimeoutError} from './classify'

/**
 * A diagnosed request failure — the reason a request the studio can't recover
 * from locally failed. Produced by {@link RequestFailureProbe} from an
 * otherwise-opaque error.
 *
 *  - `project-not-found` / `dataset-not-found` — a configuration error: the
 *    project or dataset the studio points at doesn't exist. Unrecoverable by
 *    retry; the studio takes over the screen with guidance.
 *  - `cors` — the origin isn't allowed (or can't send credentials) by the
 *    project's CORS allowlist. The studio shows the CORS-origin screen. This
 *    can begin at any time (e.g. an admin editing the allowlist in Manage),
 *    not only at boot.
 *  - `unknown` — couldn't be diagnosed (a transient network error, a timeout,
 *    a CORS-allowed origin, …). The caller falls back to its normal handling
 *    (e.g. the generic network-error dialog).
 *
 * @internal
 */
export type RequestFailureResult =
  | {type: 'project-not-found'}
  | {type: 'dataset-not-found'}
  | {type: 'cors'; allowed: boolean; withCredentials: boolean}
  | {type: 'unknown'}

/**
 * Diagnoses why a request failed. Pure classifier: it inspects the error (and,
 * for opaque network failures, probes `/check/cors`) and returns a
 * {@link RequestFailureResult}. It performs no side effects — the caller
 * decides what to do with the result (take over the screen, re-throw, …).
 *
 * Used in two places that must agree: the studio's request handler (for
 * requests that flow through it) and the auth store's `/users/me` probe (which
 * runs on a client with the request handler stripped, so it needs to diagnose
 * its own failures).
 *
 * @internal
 */
export type RequestFailureProbe = (err: unknown) => Promise<RequestFailureResult>

/**
 * Build a {@link RequestFailureProbe} bound to a client + CORS-probe cache.
 *
 * Detection order:
 *  1. A structured 404 (project/dataset management API) is a config error.
 *  2. An opaque network failure (not a timeout) is probed via `/check/cors`,
 *     which can still answer where the data API can't: a missing project
 *     (`SIO-404-PNF`) or the origin's allow/credentials verdict.
 * Everything else is `unknown`.
 *
 * @internal
 */
export function createRequestFailureProbe(
  client: SanityClient,
  corsCache: CorsCheckCache,
): RequestFailureProbe {
  return async (err) => {
    // Structured 404 from the project/dataset management API.
    const configClassification = classifyConfigError(err)
    if (configClassification) {
      return configClassification.type === 'datasetNotFound'
        ? {type: 'dataset-not-found'}
        : {type: 'project-not-found'}
    }

    // Opaque network/CORS failure — probe `/check/cors` to learn why. Skip
    // timeouts (the probe itself would just time out).
    if (!isNetworkError(err) || isTimeoutError(err)) {
      return {type: 'unknown'}
    }

    const cors = await checkCors(client, corsCache)
    if (cors === 'project-not-found') {
      return {type: 'project-not-found'}
    }
    // A satisfied CORS endpoint (allowed AND credentials) means CORS wasn't the
    // cause — leave it `unknown` so the caller surfaces its normal error.
    if (cors === null || (cors.allowed && cors.withCredentials)) {
      return {type: 'unknown'}
    }
    return {type: 'cors', allowed: cors.allowed, withCredentials: cors.withCredentials}
  }
}
