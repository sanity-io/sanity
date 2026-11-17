import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Breadcrumbs} from '@sanity/ui/breadcrumbs'
import {Icon} from 'ui5'

import {type ChangeTitlePath, type FieldChangeNode} from '../../types'
import {ChangeTitleSegment} from './ChangeTitleSegment'

/** @internal */
export function ChangeBreadcrumb(props: {change?: FieldChangeNode; titlePath: ChangeTitlePath}) {
  const {change, titlePath} = props

  return (
    <Breadcrumbs maxLength={4} separator={<Icon icon={ChevronRightIcon} size={1} muted />}>
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
