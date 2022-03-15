import {SanityTool} from '@sanity/base'
import {useRouter} from '@sanity/base/router'
import {useStudio} from '@sanity/base/studio'
import {Workshop, WorkshopFeatures, WorkshopLocation} from '@sanity/ui-workshop'
import qs from 'qs'
import React, {useCallback, useMemo} from 'react'
import {WorkshopOptions} from './types'

const workshopFeatures: WorkshopFeatures = {
  navbar: true,
}

export function WorkshopTool(props: {tool: SanityTool<WorkshopOptions>}) {
  const {scheme, setScheme} = useStudio()
  const {collections, name = 'workshop', scopes, title = 'Studio Workshop'} = props.tool.options

  const {navigateUrl, state: routerState} = useRouter()

  const segments = useMemo(
    () => (typeof routerState.path === 'string' ? routerState.path?.split(';') : []),
    [routerState]
  )

  const location: WorkshopLocation = useMemo(() => {
    return {
      path: `/${segments.filter(Boolean).join('/')}`,
      query: qs.parse(window.location.search.slice(1)) as any,
    }
  }, [segments])

  const handleLocationPush = useCallback(
    (nextLocation: WorkshopLocation) => {
      const search = nextLocation.query ? `?${qs.stringify(nextLocation.query)}` : ''

      navigateUrl({
        path: `/${name}/${nextLocation.path.slice(1).replace(/\//g, ';')}${search}`,
      })
    },
    [name, navigateUrl]
  )

  const handleLocationReplace = useCallback(
    (nextLocation: WorkshopLocation) => {
      const search = nextLocation.query ? `?${qs.stringify(nextLocation.query)}` : ''

      navigateUrl({
        path: `/${name}/${nextLocation.path.slice(1).replace(/\//g, ';')}${search}`,
        replace: true,
      })
    },
    [name, navigateUrl]
  )

  return (
    <Workshop
      collections={collections}
      features={workshopFeatures}
      frameUrl="/plugins/workshop/frame/"
      location={location}
      onLocationPush={handleLocationPush}
      onLocationReplace={handleLocationReplace}
      scheme={scheme}
      setScheme={setScheme}
      scopes={scopes}
      title={title}
    />
  )
}
