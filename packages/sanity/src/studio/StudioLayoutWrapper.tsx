import React, {useMemo} from 'react'
import {useWorkspace} from './workspace'

interface StudioLayoutWrapperProps {
  children: React.ReactNode
}

export function StudioLayoutWrapper(props: StudioLayoutWrapperProps) {
  const {children} = props
  const {studio} = useWorkspace()

  const layout = useMemo(
    () =>
      studio.components.Layout({
        children: <>{children}</>,
      }),
    [studio, children]
  )

  return <>{layout}</>
}
