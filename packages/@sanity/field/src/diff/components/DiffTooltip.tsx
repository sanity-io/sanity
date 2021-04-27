import {LegacyLayerProvider, UserAvatar} from '@sanity/base/components'
import {useUser, useTimeAgo} from '@sanity/base/hooks'
import {Path} from '@sanity/types'
import React from 'react'
import {Tooltip, TooltipPlacement} from 'part:@sanity/components/tooltip'
import {Diff, getAnnotationAtPath} from '../../diff'
import {AnnotationDetails} from '../../types'
import {useAnnotationColor} from '../annotations'

import styles from './DiffTooltip.css'

interface DiffTooltipProps {
  children: React.ReactElement
  description?: React.ReactNode
  diff: Diff
  path?: Path | string
  placement?: TooltipPlacement
}

interface DiffTooltipWithAnnotationsProps {
  annotations: AnnotationDetails[]
  children: React.ReactElement
  description?: React.ReactNode
  placement?: TooltipPlacement
}

export function DiffTooltip(props: DiffTooltipProps | DiffTooltipWithAnnotationsProps) {
  if ('diff' in props) {
    const {diff, path = [], ...restProps} = props
    const annotation = getAnnotationAtPath(diff, path)

    return <DiffTooltipWithAnnotation {...restProps} annotations={annotation ? [annotation] : []} />
  }

  return <DiffTooltipWithAnnotation {...props} />
}

function DiffTooltipWithAnnotation(props: DiffTooltipWithAnnotationsProps) {
  const {annotations, children, description = 'Changed', placement = 'auto'} = props

  if (!annotations) {
    return children
  }

  const content = (
    <div className={styles.root}>
      <div className={styles.description}>{description}</div>
      {annotations.map((annotation, idx) => (
        <AnnotationItem annotation={annotation} key={idx} />
      ))}
    </div>
  )

  return (
    <LegacyLayerProvider zOffset="paneFooter">
      <Tooltip
        content={content}
        placement={placement}
        portal
        allowedAutoPlacements={['top', 'bottom']}
      >
        {children}
      </Tooltip>
    </LegacyLayerProvider>
  )
}

function AnnotationItem({annotation}: {annotation: AnnotationDetails}) {
  const {author, timestamp} = annotation
  const {error, value: user} = useUser(author)
  const color = useAnnotationColor(annotation)
  const timeAgo = useTimeAgo(timestamp, {minimal: true})

  // @todo handle?
  if (error) {
    return null
  }

  return (
    <div className={styles.annotation}>
      <div className={styles.user} style={{backgroundColor: color.background, color: color.text}}>
        <span>
          <UserAvatar userId={author} />
        </span>
        <span className={styles.displayName}>{user ? user.displayName : 'Loading…'}</span>
      </div>
      <time className={styles.timeAgo} dateTime={timestamp}>
        {timeAgo}
      </time>
    </div>
  )
}
