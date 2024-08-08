import {SearchIcon} from '@sanity/icons'
import {Box, Container, Flex, Text, TextInput} from '@sanity/ui'
import {useVirtualizer} from '@tanstack/react-virtual'
import {type RefObject, useCallback, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {type BundleDocument} from '../../../store/bundles/types'
import {type DocumentHistory} from './documentTable/useReleaseHistory'
import {DocumentDiffContainer} from './review/DocumentDiffContainer'
import {type DocumentInBundleResult} from './useBundleDocuments'

const InputContainer = styled(Container)`
  margin: 0;
`
const VirtualizerRoot = styled.div`
  position: relative;
  width: 100%;
`

const VirtualizerTrack = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
`

// Estimation of a document with 1 change
const REVIEW_ITEM_ESTIMATED_HEIGHT = 140

export function ReleaseReview({
  documents,
  release,
  documentsHistory,
  scrollContainerRef,
}: {
  documents: DocumentInBundleResult[]
  release: BundleDocument
  documentsHistory: Record<string, DocumentHistory>
  scrollContainerRef: RefObject<HTMLDivElement>
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setIsExpandedItems] = useState<Record<string, boolean>>({})

  const toggleIsExpanded = useCallback((documentId: string) => {
    setIsExpandedItems((prev) => {
      if (typeof prev[documentId] === 'boolean') {
        return {...prev, [documentId]: !prev[documentId]}
      }
      return {...prev, [documentId]: false}
    })
  }, [])

  const filteredList = useMemo(() => {
    return documents.filter(({previewValues, document}) => {
      const fallbackTitle = typeof document.title === 'string' ? document.title : 'Untitled'
      const title =
        typeof previewValues.values.title === 'string' ? previewValues.values.title : fallbackTitle
      return title.toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [searchTerm, documents])

  const virtualizer = useVirtualizer({
    count: filteredList.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => REVIEW_ITEM_ESTIMATED_HEIGHT,
    overscan: 4,
  })
  const items = virtualizer.getVirtualItems()

  return (
    <Flex direction="column" gap={5} paddingY={6}>
      <Flex justify="space-between" align="center">
        <Text size={1} weight="semibold">
          Changes to published documents
        </Text>
        <InputContainer width={0}>
          <TextInput
            fontSize={1}
            icon={SearchIcon}
            placeholder="Search documents"
            radius={3}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.currentTarget.value)}
            onClear={() => setSearchTerm('')}
            clearButton={!!searchTerm}
          />
        </InputContainer>
      </Flex>
      <VirtualizerRoot style={{height: virtualizer.getTotalSize()}}>
        <VirtualizerTrack style={{transform: `translateY(${items[0]?.start ?? 0}px)`}}>
          {items.map((virtualRow) => {
            const {document, validation, previewValues} = filteredList[virtualRow.index]

            return (
              <Box
                paddingBottom={[5, 6]}
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
              >
                <DocumentDiffContainer
                  key={document._id}
                  release={release}
                  history={documentsHistory[document._id]}
                  document={document}
                  validation={validation}
                  previewValues={previewValues}
                  isExpanded={expandedItems[document._id] ?? true}
                  // eslint-disable-next-line react/jsx-no-bind
                  toggleIsExpanded={() => toggleIsExpanded(document._id)}
                />
              </Box>
            )
          })}
        </VirtualizerTrack>
      </VirtualizerRoot>
    </Flex>
  )
}
