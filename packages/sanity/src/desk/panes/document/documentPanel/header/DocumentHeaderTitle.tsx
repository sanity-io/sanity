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

  const activePaneTitle = useMemo(() => {
    if (connectionState !== 'connected') {
      return ''
    }

    if (error) {
      return <>{error}</>
    }

    return title || 'Untitled'
  }, [connectionState, error, title])

  // TODO: This logic is brittle needs to be refactored
  // const maxLength = useMemo(() => {
  //   const titleWidth = titleSize?.content.width
  //   const rootWidth = rootSize?.content.width

  //   if (!titleWidth || !rootWidth) {
  //     return 4
  //   }

  //   if (titleWidth > BREADCRUMB_ITEM_TITLE_MIN_WIDTH && titleWidth < rootWidth) {
  //     return 1
  //   }

  //   return titleWidth > BREADCRUMB_ITEM_TITLE_MIN_WIDTH ? 2 : 4
  // }, [rootSize?.content.width, titleSize?.content.width])

  const handleClick = useCallback(
    (index: number) => {
      // console.log('Clicked', pane, state)

      navigate({
        panes: (state as any)?.panes.slice(0, index),
      })
    },
    [navigate, state]
  )

  return (
    <Box ref={rootRef}>
      <Breadcrumbs maxLength={4}>
        {resolvedPanes.map((pane, i) => {
          // If It's loading pane, we don't want to show it in the breadcrumb
          if (pane === LOADING_PANE) {
            return null
          }

          // If it's a document, use the the value instead
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

        <BreadcrumbItem ref={titleRef}>{activePaneTitle}</BreadcrumbItem>
      </Breadcrumbs>
    </Box>
  )
}
