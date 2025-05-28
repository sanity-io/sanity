import {type ObjectDiff} from '@sanity/diff'
import {BoundaryElementProvider, Box, Card, Flex, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {
  ChangeFieldWrapper,
  ChangeList,
  type DocumentChangeContextInstance,
  LoadingBlock,
  NoChanges,
  type ObjectSchemaType,
  ScrollContainer,
  usePerspective,
  useTimelineSelector,
  useTranslation,
} from 'sanity'
import {DocumentChangeContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {structureLocaleNamespace} from '../../../../i18n'
import {TimelineMenu} from '../../timeline'
import {TimelineError} from '../../timeline/TimelineError'
import {useDocumentPane} from '../../useDocumentPane'

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

export function ChangesInspector({showChanges}: {showChanges: boolean}): React.JSX.Element {
  const {documentId, schemaType, timelineError, timelineStore, value} = useDocumentPane()
  const {selectedReleaseId} = usePerspective()

  const [scrollRef, setScrollRef] = useState<HTMLDivElement | null>(null)

  const rev = useTimelineSelector(timelineStore, (state) => state.revTime)
  const diff = useTimelineSelector(timelineStore, (state) => state.diff)
  const onOlderRevision = useTimelineSelector(timelineStore, (state) => state.onOlderRevision)
  const selectionState = useTimelineSelector(timelineStore, (state) => state.selectionState)
  const sinceTime = useTimelineSelector(timelineStore, (state) => state.sinceTime)
  const loading = selectionState === 'loading'
  const isComparingCurrent = !onOlderRevision

  // Note that we are using the studio core namespace here, as changes theoretically should
  // be part of Sanity core (needs to be moved from structure at some point)
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

  if (selectedReleaseId) {
    return (
      <Flex data-testid="review-changes-pane" direction="column" height="fill">
        <Card flex={1} padding={2} paddingTop={0}>
          <TimelineError versionError />
        </Card>
      </Flex>
    )
  }

  return (
    <Flex data-testid="review-changes-pane" direction="column" height="fill" overflow="hidden">
      <Box padding={3}>
        <Grid paddingX={2} paddingBottom={2}>
          <Text size={1} muted>
            {structureT('changes.from.label')}
          </Text>

          <TimelineMenu mode="since" chunk={sinceTime} placement="bottom-start" />
          <Text size={1} muted>
            {structureT('changes.to.label')}
          </Text>
          <TimelineMenu chunk={rev} mode="rev" placement="bottom-end" />
        </Grid>
      </Box>

      <Card flex={1} paddingX={2} paddingY={2}>
        <BoundaryElementProvider element={scrollRef}>
          <Scroller data-ui="Scroller" ref={setScrollRef}>
            <Box flex={1} paddingX={3} height="fill">
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
