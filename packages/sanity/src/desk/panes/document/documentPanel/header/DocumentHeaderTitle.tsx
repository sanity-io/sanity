import React, {type ReactElement, useMemo, useRef, useCallback} from 'react'
import {Box} from '@sanity/ui'
import {useDocumentTitle} from '../../useDocumentTitle'
import {useDocumentPane} from '../../useDocumentPane'
import {useResolvedPanes} from '../../../../structureResolvers'
import {BreadcrumbItem, Breadcrumbs} from '../../../../components/breadcrumbs'
import {LOADING_PANE} from '../../../../constants'
import {useRouter} from 'sanity/router'

export function DocumentHeaderTitle(): ReactElement {
  const {connectionState} = useDocumentPane()
  const {error, title} = useDocumentTitle()
  const {resolvedPanes} = useResolvedPanes()
  const {navigate, state} = useRouter()
  const titleRef = useRef<HTMLButtonElement | null>(null)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const activePaneTitle: string = useMemo(() => {
    if (connectionState !== 'connected') {
      return ''
    }

    if (error) {
      return error
    }

    return title || 'Untitled'
  }, [connectionState, error, title])

  const handleClick = useCallback(
    (index: number) => {
      navigate({
        panes: (state as any)?.panes.slice(0, index),
      })
    },
    [navigate, state]
  )

  return (
    <Box ref={rootRef}>
      {/* TODO: Dynamically calculate max content */}
      <Breadcrumbs maxLength={3}>
        {resolvedPanes.map((pane, i) => {
          // If It's loading pane, we don't want to show it in the breadcrumb
          if (pane === LOADING_PANE) {
            return null
          }

          // Document titles are treated specially so ignoring them here
          if (pane.type === 'document') {
            return null
          }

          return (
            // eslint-disable-next-line react/jsx-no-bind
            <BreadcrumbItem onClick={() => handleClick(i)} key={pane.id}>
              {pane.title}
            </BreadcrumbItem>
          )
        })}

        <BreadcrumbItem isTitle ref={titleRef}>
          {activePaneTitle}
        </BreadcrumbItem>
      </Breadcrumbs>
    </Box>
  )
}
