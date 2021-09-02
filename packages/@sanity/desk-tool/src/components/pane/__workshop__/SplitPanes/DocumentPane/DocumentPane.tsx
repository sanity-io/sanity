import {Flex} from '@sanity/ui'
import React, {useState, useCallback, useEffect} from 'react'
import {Pane} from '../../../Pane'
import {usePaneLayout} from '../../../usePaneLayout'
import {DocumentViewPanel} from './DocumentViewPanel'
import {ReviewChangesPanel} from './ReviewChangesPanel'

export function DocumentPane() {
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const [reviewChanges, setReviewChanges] = useState(false)
  const toggleReviewChanges = useCallback(() => setReviewChanges((v) => !v), [])
  const closeReviewChanges = useCallback(() => setReviewChanges(false), [])

  useEffect(() => {
    if (layoutCollapsed) setReviewChanges(false)
  }, [layoutCollapsed])

  return (
    <Pane flex={2.5} minWidth={reviewChanges ? 320 + 320 : 320}>
      <Flex flex={1} height="fill">
        <DocumentViewPanel
          reviewChanges={reviewChanges}
          toggleReviewChanges={toggleReviewChanges}
        />

        {reviewChanges && <ReviewChangesPanel onClose={closeReviewChanges} />}
      </Flex>
    </Pane>
  )
}
