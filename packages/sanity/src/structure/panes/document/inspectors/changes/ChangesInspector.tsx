import {type ObjectDiff} from '@sanity/diff'
import {AvatarStack, BoundaryElementProvider, Box, Card, Flex, Text} from '@sanity/ui'
import {type ReactElement, useMemo, useRef} from 'react'
import {
  ChangeFieldWrapper,
  ChangeList,
  DiffTooltip,
  type DocumentChangeContextInstance,
  LoadingBlock,
  NoChanges,
  type ObjectSchemaType,
  ScrollContainer,
  UserAvatar,
  useTimelineSelector,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {collectLatestAuthorAnnotations} from './helpers'

const Scroller = styled(ScrollContainer)`
  height: 100%;
  overflow: auto;
  position: relative;
  scroll-behavior: smooth;
`

const Grid = styled(Box)`
  &:not([hidden]) {
    display: grid;
  }
  grid-template-columns: 48px 1fr;
  align-items: center;
  gap: 0.25em;
`

export function ChangesInspector({showChanges}: {showChanges: boolean}): ReactElement {
  const {documentId, schemaType, timelineError, timelineStore, value} = useDocumentPane()
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Subscribe to external timeline state changes
  const rev = useTimelineSelector(timelineStore, (state) => state.revTime)
  const diff = useTimelineSelector(timelineStore, (state) => state.diff)
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const selectionState = useTimelineSelector(timelineStore, (state) => state.selectionState)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)
  const loading = selectionState === 'loading'
  const isComparingCurrent = !onOlderRevision

  // Note that we are using the studio core namespace here, as changes theoretically should
  // be part of Sanity core (needs to be moved from structure at some point)
  const {t} = useTranslation('studio')
  const {t: structureT} = useTranslation(structureLocaleNamespace)

  const documentContext: DocumentChangeContextInstance = useMemo(
    () => ({
      documentId,
      schemaType,
      FieldWrapper: ChangeFieldWrapper,
      rootDiff: diff,
      isComparingCurrent,
      value,
      showFromValue: true,
    }),
    [documentId, diff, isComparingCurrent, schemaType, value],
  )

  const changeAnnotations = useMemo(
    () => (diff ? collectLatestAuthorAnnotations(diff) : []),
    [diff],
  )

  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill" overflow="hidden">
      <Box padding={3}>
        <Grid paddingX={1}>
          <Text size={1} muted>
            {structureT('changes.from.label')}
          </Text>

          <TimelineMenu mode="since" chunk={sinceTime} placement="bottom-start" />
          <Text size={1} muted>
            {structureT('changes.to.label')}
          </Text>
          <TimelineMenu chunk={rev} mode="rev" placement="bottom-end" />
        </Grid>
        {changeAnnotations.length > 0 && (
          <Flex width={'full'} justify={'flex-end'} padding={3} paddingBottom={0}>
            <DiffTooltip
              annotations={changeAnnotations}
              description={t('changes.changes-by-author')}
              portal
            >
              <AvatarStack maxLength={4} aria-label={t('changes.changes-by-author')}>
                {changeAnnotations.map(({author}) => (
                  <UserAvatar key={author} user={author} size={0} />
                ))}
              </AvatarStack>
            </DiffTooltip>
          </Flex>
        )}
      </Box>

      <Card flex={1}>
        <BoundaryElementProvider element={scrollRef.current}>
          <Scroller data-ui="Scroller" ref={scrollRef}>
            <Box flex={1} padding={3} paddingTop={2} height="fill">
              {showChanges && (
                <Content
                  diff={diff}
                  documentContext={documentContext}
                  error={timelineError}
                  loading={loading}
                  schemaType={schemaType}
                />
              )}
            </Box>
          </Scroller>
        </BoundaryElementProvider>
      </Card>
    </Flex>
  )
}

function Content({
  error,
  diff,
  documentContext,
  loading,
  schemaType,
}: {
  error?: Error | null
  diff: ObjectDiff<any> | null
  documentContext: DocumentChangeContextInstance
  loading: boolean
  schemaType: ObjectSchemaType
}) {
  if (error) {
    return <NoChanges />
  }

  if (loading) {
    return <LoadingBlock showText />
  }

  if (!diff) {
    return <NoChanges />
  }

  return (
    <DocumentChangeContext.Provider value={documentContext}>
      <ChangeList diff={diff} schemaType={schemaType} />
    </DocumentChangeContext.Provider>
  )
}
