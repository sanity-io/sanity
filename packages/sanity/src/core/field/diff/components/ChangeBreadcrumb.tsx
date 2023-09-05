import React from 'react'
import {Breadcrumbs, Text} from '@sanity/ui'
import {ChevronRightIcon} from '@sanity/icons'
import {ChangeTitlePath, FieldChangeNode} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'

/** @internal */
export function ChangeBreadcrumb(props: {change?: FieldChangeNode; titlePath: ChangeTitlePath}) {
  const {change, titlePath} = props

  return (
    <Breadcrumbs
      maxLength={4}
      separator={
        <Text muted size={1}>
          <ChevronRightIcon />
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
