import {useRouter} from 'sanity/router'
import {WorkshopLocation, WorkshopLocationStore} from '@sanity/ui-workshop'
import qs from 'qs'
import {useCallback, useMemo, useRef} from 'react'

export function useLocationStore(props: {baseUrl?: string} = {}): WorkshopLocationStore {
  const {baseUrl = ''} = props
  const {navigateUrl, state: routerState} = useRouter()

  const segmentsRef = useRef(
    typeof routerState.path === 'string' ? routerState.path?.split(';') : [],
  )

  const subscribersRef = useRef<((nextLocation: WorkshopLocation) => void)[]>([])

  const get = useCallback(() => {
    return {
      path: `/${segmentsRef.current.filter(Boolean).join('/')}`,
      query: qs.parse(window.location.search.slice(1)) as any,
    }
  }, [])

  const push = useCallback(
    (nextLocation: Omit<WorkshopLocation, 'type'>) => {
      const search = nextLocation.query ? `?${qs.stringify(nextLocation.query)}` : ''

      segmentsRef.current = nextLocation.path.split('/')

      const path = [baseUrl, nextLocation.path.slice(1).replace(/\//g, ';')]
        .filter(Boolean)
        .join('/')

      navigateUrl({
        path: `${path}${search}`,
      })

      for (const subscriber of subscribersRef.current) {
        subscriber({type: 'push', ...nextLocation})
      }
    },
    [baseUrl, navigateUrl],
  )

  const replace = useCallback(
    (nextLocation: Omit<WorkshopLocation, 'type'>) => {
      const search = nextLocation.query ? `?${qs.stringify(nextLocation.query)}` : ''

      segmentsRef.current = nextLocation.path.split('/')

      const path = [baseUrl, nextLocation.path.slice(1).replace(/\//g, ';')]
        .filter(Boolean)
        .join('/')

      navigateUrl({
        path: `${path}${search}`,
        replace: true,
      })

      for (const subscriber of subscribersRef.current) {
        subscriber({type: 'replace', ...nextLocation})
      }
    },
    [baseUrl, navigateUrl],
  )

  const subscribe = useCallback((subscriber: any) => {
    subscribersRef.current.push(subscriber)

    return () => {
      const idx = subscribersRef.current.indexOf(subscriber)

      if (idx > -1) {
        subscribersRef.current.splice(idx, 1)
      }
    }
  }, [])

  return useMemo(() => ({get, push, replace, subscribe}), [get, push, replace, subscribe])
}
