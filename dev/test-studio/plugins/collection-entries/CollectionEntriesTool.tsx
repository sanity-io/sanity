import './collectionEntries.css'

import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {CommentIcon} from '@sanity/icons/Comment'
import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {type ReactNode, useState} from 'react'
import {type RouterState, type SearchParam, useRouter, useStateLink} from 'sanity/router'
import {type EditReferenceOptions, StructureToolProvider} from 'sanity/structure'

import {CollectionDashboard} from './CollectionDashboard'
import {EntryCommentsPane} from './comments'
import {ENTRY_TYPE, COLLECTION_TYPE, STUDIO_COMMENTS_INSPECTOR} from './constants'
import {FormOnlyDocumentPane, type PaneParams} from './FormOnlyDocumentPane'

const ENTRY_COMMENTS_COLUMN_WIDTH = 380

function readParam(state: RouterState, name: string): string | undefined {
  const value = state[name]
  return typeof value === 'string' ? value : undefined
}

function toSearchParams(params: PaneParams): SearchParam[] {
  return Object.entries(params).flatMap(([name, value]): SearchParam[] =>
    typeof value === 'string' ? [[name, value]] : [],
  )
}

// Pane params live in the URL, as in the structure tool, so changing them never remounts the pane.
export function CollectionEntriesTool() {
  const {state, navigate} = useRouter()
  const collectionId = readParam(state, 'collectionId')
  const entryId = readParam(state, 'entryId')
  const paneParams: PaneParams = Object.fromEntries(state._searchParams ?? [])
  const isCommentsOpen = paneParams.inspect === STUDIO_COMMENTS_INSPECTOR
  const [isEntryCommentsOpen, setIsEntryCommentsOpen] = useState(true)
  const documentId = entryId ?? collectionId

  function setPaneParams(nextParams: PaneParams) {
    navigate({...state, _searchParams: toSearchParams(nextParams)}, {replace: true})
  }

  function toggleComments() {
    setPaneParams({...paneParams, inspect: isCommentsOpen ? undefined : STUDIO_COMMENTS_INSPECTOR})
  }

  function toggleEntryComments() {
    setIsEntryCommentsOpen((open) => !open)
  }

  function openEntry(options: EditReferenceOptions) {
    navigate(collectionId ? {collectionId, entryId: options.id} : {entryId: options.id})
  }

  function openEntryComment(targetEntryId: string, commentId: string) {
    navigate({
      ...(collectionId ? {collectionId} : {}),
      entryId: targetEntryId,
      _searchParams: toSearchParams({inspect: STUDIO_COMMENTS_INSPECTOR, comment: commentId}),
    })
  }

  if (documentId === undefined) {
    return (
      <StructureToolProvider>
        <CollectionDashboard />
      </StructureToolProvider>
    )
  }

  return (
    <StructureToolProvider>
      <ToolFrame
        backState={entryId && collectionId ? {collectionId} : {}}
        backLabel={entryId && collectionId ? 'Back to collection' : 'All collections'}
        title={entryId ? 'Entry' : 'Collection'}
        headerAction={
          entryId ? (
            <HeaderToggle text="Comments" selected={isCommentsOpen} onClick={toggleComments} />
          ) : (
            <HeaderToggle
              text="Entry comments"
              selected={isEntryCommentsOpen}
              onClick={toggleEntryComments}
            />
          )
        }
      >
        <Flex height="fill">
          <Box flex={1} style={{minHeight: 0, minWidth: 0}}>
            <FormOnlyDocumentPane
              key={documentId}
              documentId={documentId}
              documentType={entryId ? ENTRY_TYPE : COLLECTION_TYPE}
              params={paneParams}
              onParamsChange={setPaneParams}
              onEditReference={openEntry}
            />
          </Box>
          {entryId === undefined && isEntryCommentsOpen && (
            <Card
              borderLeft
              height="fill"
              overflow="hidden"
              style={{width: ENTRY_COMMENTS_COLUMN_WIDTH, flexShrink: 0}}
            >
              <EntryCommentsPane collectionId={documentId} onOpenEntry={openEntryComment} />
            </Card>
          )}
        </Flex>
      </ToolFrame>
    </StructureToolProvider>
  )
}

interface HeaderToggleProps {
  text: string
  selected: boolean
  onClick: () => void
}

function HeaderToggle({text, selected, onClick}: HeaderToggleProps) {
  return (
    <Button
      icon={CommentIcon}
      mode="bleed"
      text={text}
      selected={selected}
      aria-pressed={selected}
      onClick={onClick}
    />
  )
}

interface ToolFrameProps {
  backState: RouterState
  backLabel: string
  title: string
  headerAction: ReactNode
  children: ReactNode
}

function ToolFrame({backState, backLabel, title, headerAction, children}: ToolFrameProps) {
  const backLink = useStateLink({state: backState})

  return (
    <Flex direction="column" height="fill">
      <Card borderBottom paddingX={3} paddingY={2}>
        <Flex align="center" gap={3}>
          <Button
            as="a"
            href={backLink.href}
            onClick={backLink.onClick}
            icon={ArrowLeftIcon}
            mode="bleed"
            text={backLabel}
          />
          <Box flex={1}>
            <Text muted size={1}>
              {title}
            </Text>
          </Box>
          {headerAction}
        </Flex>
      </Card>
      <Box flex={1} style={{minHeight: 0}}>
        {children}
      </Box>
    </Flex>
  )
}
