import {Flex} from '@sanity/ui'
import React, {useState, useCallback, useEffect} from 'react'
import {Pane} from '../../../Pane'
import {usePaneLayout} from '../../../usePaneLayout'
import {DocumentPaneNode} from '../types'
import {DocumentViewPanel} from './DocumentViewPanel'
import {ReviewChangesPanel} from './ReviewChangesPanel'

export function DocumentPane(props: {
  index: number
  node: DocumentPaneNode
  setPath: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const {index, node, setPath} = props
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const [reviewChanges, setReviewChanges] = useState(false)
  const toggleReviewChanges = useCallback(() => setReviewChanges((v) => !v), [])
  const closeReviewChanges = useCallback(() => setReviewChanges(false), [])

  useEffect(() => {
    if (layoutCollapsed) setReviewChanges(false)
  }, [layoutCollapsed])

  const handleBackClick = useCallback(() => {
    setPath((p) => p.slice(0, index))
  }, [index, setPath])

  return (
    <Pane
      currentMinWidth={reviewChanges ? 600 + 320 : 600}
      flex={2.5}
      id={String(index)}
      minWidth={reviewChanges ? 320 + 320 : 320}
    >
      <Flex flex={1} height="fill">
        <DocumentViewPanel
          onBackClick={handleBackClick}
          reviewChanges={reviewChanges}
          title={`Document #${node.id}`}
          toggleReviewChanges={toggleReviewChanges}
        />

        {reviewChanges && <ReviewChangesPanel onClose={closeReviewChanges} />}
      </Flex>
    </Pane>
  )
}
