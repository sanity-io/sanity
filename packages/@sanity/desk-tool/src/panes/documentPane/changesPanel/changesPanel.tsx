/* eslint-disable max-depth */
import React, {useCallback} from 'react'
import {
  ObjectDiff,
  ObjectSchemaType,
  DocumentChangeContext,
  DiffAnnotationTooltipContent,
  ChangeList,
  Chunk,
  DocumentChangeContextProps
} from '@sanity/field/diff'
import CloseIcon from 'part:@sanity/base/close-icon'
import {UserAvatar} from '@sanity/base/components'
import {Tooltip} from 'part:@sanity/components/tooltip'
import Button from 'part:@sanity/components/buttons/default'
import {AvatarStack} from 'part:@sanity/components/avatar'
import {useTimeAgo} from '@sanity/base/hooks'
import {formatTimelineEventLabel} from '../timeline'
import {useDocumentHistory} from '../documentHistory'

import styles from './changesPanel.css'
import {collectLatestAuthorAnnotations} from './helpers'

interface ChangesPanelProps {
  changesSinceSelectRef: React.MutableRefObject<HTMLDivElement | null>
  documentId: string
  isTimelineOpen: boolean
  loading: boolean
  onTimelineOpen: () => void
  schemaType: ObjectSchemaType
  since: Chunk | null
  timelineMode: 'rev' | 'since' | 'closed'
}

export function ChangesPanel({
  changesSinceSelectRef,
  documentId,
  isTimelineOpen,
  loading,
  onTimelineOpen,
  since,
  schemaType,
  timelineMode
}: ChangesPanelProps): React.ReactElement | null {
  const {close: closeHistory, historyController} = useDocumentHistory()
  const diff: ObjectDiff | null = historyController.currentObjectDiff() as any

  const documentContext: DocumentChangeContextProps = React.useMemo(
    () => ({
      documentId,
      schemaType,
      rootDiff: diff
    }),
    [documentId, schemaType, diff]
  )

  const changeAnnotations = React.useMemo(
    () => (diff ? collectLatestAuthorAnnotations(diff) : []),
    [diff]
  )

  // This is needed to stop the ClickOutside-handler (in the Popover) to treat the click
  // as an outside-click.
  const ignoreClickOutside = useCallback((evt: React.MouseEvent<HTMLButtonElement>) => {
    evt.stopPropagation()
  }, [])

  const menuOpen = isTimelineOpen && timelineMode === 'since'

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.mainNav}>
          <h2 className={styles.title}>Changes</h2>
          <div className={styles.closeButtonContainer}>
            <Button
              icon={CloseIcon}
              kind="simple"
              onClick={closeHistory}
              padding="small"
              title="Hide changes panel"
              type="button"
            />
          </div>
        </div>
        <div className={styles.versionSelectContainer}>
          <div ref={changesSinceSelectRef} style={{display: 'inline-block'}}>
            <Button
              kind="simple"
              onMouseUp={ignoreClickOutside}
              onClick={onTimelineOpen}
              padding="small"
              selected={isTimelineOpen && timelineMode === 'since'}
              size="small"
            >
              {/* eslint-disable-next-line no-nested-ternary */}
              {menuOpen ? (
                <>Review changes since</>
              ) : since ? (
                <SinceText since={since} />
              ) : (
                <>Since unknown version</>
              )}{' '}
              &darr;
            </Button>
          </div>
          {changeAnnotations.length > 0 && (
            <Tooltip
              content={
                (
                  <DiffAnnotationTooltipContent
                    description="Changes by"
                    annotations={changeAnnotations}
                  />
                ) as any
              }
              placement="top"
            >
              <div className={styles.changeAuthorsContainer}>
                <AvatarStack className={styles.changeAuthorsAvatarStack} maxLength={4}>
                  {changeAnnotations.map(({author}) => (
                    <UserAvatar key={author} userId={author} />
                  ))}
                </AvatarStack>
              </div>
            </Tooltip>
          )}
        </div>
      </header>

      <div className={styles.body}>
        {loading || !diff ? (
          <div>Loading…</div>
        ) : (
          <DocumentChangeContext.Provider value={documentContext}>
            <div className={styles.changeList}>
              <ChangeList diff={diff} schemaType={schemaType} />
            </div>
          </DocumentChangeContext.Provider>
        )}
      </div>
    </div>
  )
}

function SinceText({since}: {since: Chunk}): React.ReactElement {
  const timeAgo = useTimeAgo(since.endTimestamp)

  return (
    <>
      Since {formatTimelineEventLabel(since.type)} {timeAgo}
    </>
  )
}
