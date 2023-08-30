import React, { useMemo } from 'react'
import {Breadcrumbs, Text} from '@sanity/ui'
import {ChangeTitlePath, FieldChangeNode} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'

/** @internal */
export function ChangeBreadcrumb(props: {change?: FieldChangeNode; titlePath: ChangeTitlePath}) {
  const {change, titlePath} = props
  const maxLength = useMemo(() => { 
    if(change && change?.titlePath.length > 3) { 
      return 4
    }
    return undefined
  }, [change]) 

  return (
    <Breadcrumbs
    maxLength={maxLength}
      separator={
        <Text muted size={1}>
          {'>'}
        </Text>
      }
    >
      {titlePath.map((titleSegment, idx) => {
        const showSegment = typeof titleSegment === 'string' || !change || change.showIndex

        if (!showSegment) {
          return null
        }

        return <ChangeTitleSegment change={change} key={idx} segment={titleSegment} />
      })}
    </Breadcrumbs>
  )
}
