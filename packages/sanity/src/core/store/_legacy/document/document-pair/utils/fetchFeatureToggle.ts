import {type SanityClient} from '@sanity/client'
import {map, type Observable, of, type OperatorFunction, ReplaySubject, timeout, timer} from 'rxjs'
import {catchError, concatMap, share} from 'rxjs/operators'
import {satisfies} from 'semver'

import {SANITY_VERSION} from '../../../../../version'

export interface ActionsFeatureToggle {
  enabled: boolean
  compatibleStudioVersions: string
}

const CACHE = new WeakMap<SanityClient, Observable<boolean>>()

// How often to refresh the feature toggle
const REFRESH_INTERVAL = 1000 * 120

// Timer used to reset the observable when it completes or it's refcount drops to zero
const RESET_TIMER = timer(REFRESH_INTERVAL)

function createFeatureToggle(client: SanityClient) {
  const {dataset} = client.config()

  return timer(0, REFRESH_INTERVAL).pipe(
    concatMap(() =>
      client.observable
        .request({
          uri: `/data/actions/${dataset}`,
        })
        .pipe(
          mapResponse(),
          timeout({first: 2000, with: () => of(false)}),
          catchError(() =>
            // If we fail to fetch the feature toggle, we'll just assume it's disabled and fallback to legacy mutations
            of(false),
          ),
        ),
    ),
    share({
      // replay latest known state to new subscribers
      connector: () => new ReplaySubject(1),
      // this will typically be completed and unsubscribed from right after the answer is received, so we don't want to reset
      resetOnComplete: () => RESET_TIMER,
      // keep it alive for some time after the last subscriber unsubscribes
      resetOnRefCountZero: () => RESET_TIMER,
    }),
  )
}

export function mapResponse(): OperatorFunction<ActionsFeatureToggle, boolean> {
  return map<ActionsFeatureToggle, boolean>(
    (res) =>
      res.enabled &&
      satisfies(SANITY_VERSION, res.compatibleStudioVersions, {
        includePrerelease: true,
      }),
  )
}

export const fetchFeatureToggle = (client: SanityClient): Observable<boolean> => {
  if (!CACHE.has(client)) {
    CACHE.set(client, createFeatureToggle(client))
  }
  return CACHE.get(client)!
}
