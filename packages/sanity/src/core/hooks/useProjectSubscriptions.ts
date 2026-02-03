import {type SanityClient} from '@sanity/client'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {type Observable, of} from 'rxjs'
import {catchError, map, shareReplay, startWith} from 'rxjs/operators'

import {useSource} from '../studio'
import {DEFAULT_STUDIO_CLIENT_OPTIONS} from '../studioClient'
import {useClient} from './useClient'

type FeatureAttributes = Record<string, string | number | boolean | null>

interface Feature {
  id: string
  variantId: string
  name: string
  price: number
  included: boolean
  attributes: FeatureAttributes
}

interface FeatureType {
  id: string
  name: string
  singular: boolean
  features: Feature[]
}

interface Resource {
  id: string
  name: string
  unit: string
  type: string
  quota: number | null
  custom: boolean
  overageAllowed: boolean
  overageChunkSize: number
  overageChunkPrice: number
  maxOverageQuota: number | null
}

interface Plan {
  id: string
  planTypeId: string
  variantId: string | null
  productType: string
  variantOfPlanId: string | null
  name: string
  variantName: string | null
  price: number
  trialDays: number
  createdAt: string
  supersededAt: string | null
  default: boolean
  public: boolean
  orderable: boolean
  isBasePlan: boolean
  pricingModel: string
  resources: Record<string, Resource>
  featureTypes: Record<string, FeatureType>
}

/**
 * @internal
 */
export interface ProjectSubscriptionsResponse {
  id: string
  projectId: string
  productType: string
  productId: string
  customerId: string | null
  planId: string
  previousSubscriptionId: string | null
  status: string
  startedAt: string
  startedBy: string
  endedAt: string
  endedBy: string
  trialUntil: string | null
  plan: Plan
  resources: Record<string, Resource>
  featureTypes: Record<string, FeatureType>
}

interface ProjectSubscriptions {
  error: Error | null
  projectSubscriptions: ProjectSubscriptionsResponse | null
  isLoading: boolean
}

const INITIAL_LOADING_STATE: ProjectSubscriptions = {
  error: null,
  projectSubscriptions: null,
  isLoading: true,
}

/**
 * @internal
 * fetches subscriptions for this project
 */
function fetchProjectSubscriptions({
  versionedClient,
}: {
  versionedClient: SanityClient
}): Observable<ProjectSubscriptionsResponse> {
  return versionedClient.observable.request<ProjectSubscriptionsResponse>({
    uri: `/subscriptions/project/${versionedClient.config().projectId}`,
    tag: 'project-subscriptions',
  })
}

const cachedProjectSubscriptionsRequest = new Map<
  string,
  Observable<ProjectSubscriptionsResponse>
>()

/** @internal */
export function useProjectSubscriptions(): ProjectSubscriptions {
  const versionedClient = useClient(DEFAULT_STUDIO_CLIENT_OPTIONS)
  const {projectId} = useSource()

  if (!cachedProjectSubscriptionsRequest.get(projectId)) {
    const projectSubscriptions = fetchProjectSubscriptions({versionedClient}).pipe(shareReplay())
    cachedProjectSubscriptionsRequest.set(projectId, projectSubscriptions)
  }

  const projectSubscriptionsObservable = useMemo(() => {
    const projectSubscriptions$ = cachedProjectSubscriptionsRequest.get(projectId)

    if (!projectSubscriptions$)
      return of<ProjectSubscriptions>({
        isLoading: false,
        error: null,
        projectSubscriptions: null,
      })

    return projectSubscriptions$.pipe(
      map((cachedSubscriptions) => ({
        isLoading: false,
        projectSubscriptions: cachedSubscriptions,
        error: null,
      })),
      startWith(INITIAL_LOADING_STATE),
      catchError((error: Error) =>
        of<ProjectSubscriptions>({
          isLoading: false,
          projectSubscriptions: null,
          error,
        }),
      ),
    )
  }, [projectId])

  return useObservable(projectSubscriptionsObservable, INITIAL_LOADING_STATE)
}
