import {Layer} from '@sanity/ui'
import React from 'react'
import {useZIndex} from '../../../../../components'

export function DefaultPaneFooter(props: {children?: React.ReactNode; className?: string}) {
  const {children, className} = props
  const zindex = useZIndex()

  return (
    <Layer className={className} zOffset={zindex.pane}>
      {children}
    </Layer>
  )
}
