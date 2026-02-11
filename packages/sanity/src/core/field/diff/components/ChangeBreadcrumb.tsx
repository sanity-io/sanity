import {ChevronRightIcon} from '@sanity/icons'
import {Breadcrumbs, Text} from '@sanity/ui'

import {type ChangeTitlePath, type FieldChangeNode} from '../../types'
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

        // oxlint-disable-next-line no-array-index-key
        return <ChangeTitleSegment key={idx} change={change} segment={titleSegment} />
      })}
    </Breadcrumbs>
  )
}
