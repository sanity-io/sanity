import {Placement} from '@popperjs/core'
import {Chunk} from '@sanity/field/diff'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import React, {useCallback} from 'react'
import {useDocumentHistory} from '../documentHistory'
import {sinceTimelineProps, revTimelineProps} from './helpers'
import {Timeline} from './timeline'

// import styles from './timelinePopover.css'

interface TimelinePopoverProps {
  onClose: () => void
  open: boolean
  placement: Placement
  targetElement: HTMLDivElement | null
}

export function TimelinePopover(props: TimelinePopoverProps) {
  const {onClose, open, targetElement} = props

  // const openRef = useRef(open)

  // const [mounted, setMounted] = useState(false)

  const {
    historyController,
    setRange,
    setTimelineMode,
    timeline,
    timelineMode,
  } = useDocumentHistory()

  const selectRev = useCallback(
    (revChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewRev(revChunk)
      setTimelineMode('closed')
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const selectSince = useCallback(
    (sinceChunk: Chunk) => {
      const [sinceId, revId] = historyController.findRangeForNewSince(sinceChunk)
      setTimelineMode('closed')
      setRange(sinceId, revId)
    },
    [historyController, setRange, setTimelineMode]
  )

  const loadMoreHistory = useCallback(
    (state: boolean) => {
      historyController.setLoadMore(state)
    },
    [historyController]
  )

  const content = (
    <ClickOutside onClickOutside={onClose}>
      {(ref) =>
        timelineMode === 'rev' ? (
          <Timeline
            ref={ref as any}
            timeline={timeline}
            onSelect={selectRev}
            onLoadMore={loadMoreHistory}
            {...revTimelineProps(historyController.realRevChunk)}
          />
        ) : (
          <Timeline
            ref={ref as any}
            timeline={timeline}
            onSelect={selectSince}
            onLoadMore={loadMoreHistory}
            {...sinceTimelineProps(historyController.sinceTime!, historyController.realRevChunk)}
          />
        )
      }
    </ClickOutside>
  )

  // @todo
  // // Set `transition` after visible mount
  // useEffect(() => {
  //   if (!openRef.current) {
  //     setMounted(false)

  //     requestAnimationFrame(() => {
  //       requestAnimationFrame(() => {
  //         setMounted(true)
  //       })
  //     })
  //   }

  //   openRef.current = open
  // }, [open])

  return (
    <Popover
      // className={classNames(styles.root, mounted && styles.mounted)}
      content={content}
      open={open}
      targetElement={targetElement}
    />
  )
}
