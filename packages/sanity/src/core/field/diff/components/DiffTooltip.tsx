import {type Path} from '@sanity/types'
import {Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {type ReactElement, type ReactNode} from 'react'

import {useEvents} from '../../../../structure/panes/document/HistoryProvider'
import {Event} from '../../../../structure/panes/document/timeline/events/Event'
import {Tooltip, type TooltipProps} from '../../../../ui-components'
import {LegacyLayerProvider, UserAvatar} from '../../../components'
import {useRelativeTime} from '../../../hooks'
import {useTranslation} from '../../../i18n'
import {useUser} from '../../../store'
import {type AnnotationDetails, type Diff} from '../../types'
import {getAnnotationAtPath, useAnnotationColor} from '../annotations'

/** @internal */
export interface DiffTooltipProps extends TooltipProps {
  children: ReactElement
  description?: ReactNode
  diff: Diff
  path?: Path | string
}

/** @internal */
export interface DiffTooltipWithAnnotationsProps extends TooltipProps {
  annotations: AnnotationDetails[]
  children: ReactElement
  description?: ReactNode
}

/** @internal */
export function DiffTooltip(props: DiffTooltipProps | DiffTooltipWithAnnotationsProps) {
  if (!('diff' in props)) {
    return <DiffTooltipWithAnnotation {...props} />
  }

  const {diff, path = [], ...restProps} = props
  const annotation = getAnnotationAtPath(diff, path)

  return <DiffTooltipWithAnnotation {...restProps} annotations={annotation ? [annotation] : []} />
}

function DiffTooltipWithAnnotation(props: DiffTooltipWithAnnotationsProps) {
  const {annotations, children, description, ...restProps} = props
  const {t} = useTranslation()

  if (!annotations) {
    return children
  }

  const content = (
    <Stack space={2} style={{minWidth: '240px'}} paddingTop={1}>
      <Text muted size={1} weight="medium">
        {description || t('changes.changed-label')}
      </Text>
      <Stack space={2}>
        {annotations.map((annotation, idx) => (
          <AnnotationItem annotation={annotation} key={idx} />
        ))}
      </Stack>
    </Stack>
  )

  return (
    <LegacyLayerProvider zOffset="paneFooter">
      <Tooltip content={content} portal {...restProps}>
        {children}
      </Tooltip>
    </LegacyLayerProvider>
  )
}

function AnnotationItem({annotation}: {annotation: AnnotationDetails}) {
  const {author, timestamp} = annotation
  const [user] = useUser(author)
  const color = useAnnotationColor(annotation)
  const timeAgo = useRelativeTime(timestamp, {minimal: true})
  const {t} = useTranslation()
  const {documentVariantType} = useEvents()
  return (
    <>
      {annotation.event ? (
        <>
          <Card borderBottom marginBottom={2} />
          <Event
            documentVariantType={documentVariantType}
            event={annotation.event}
            showChangesBy="inline"
          />
        </>
      ) : (
        <Inline space={2}>
          <Flex
            align="center"
            paddingRight={3}
            style={{
              backgroundColor: color.background,
              color: color.text,
              borderRadius: 'calc(23px / 2)',
            }}
          >
            <UserAvatar user={author} />
            <Inline paddingLeft={2}>
              <Text muted size={1} style={{color: color.text}}>
                {user ? user.displayName : t('changes.loading-author')}
              </Text>
            </Inline>
          </Flex>
          <Text as="time" muted size={1} dateTime={timestamp}>
            {timeAgo}
          </Text>
        </Inline>
      )}
    </>
  )
}
