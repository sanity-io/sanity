import {
  defineDecorator,
  defineSchema,
  defineTextBlock,
  EditorProvider,
  type PortableTextBlock,
  PortableTextEditable,
  type RangeDecoration,
} from '@portabletext/editor'
import {NodePlugin} from '@portabletext/editor/plugins'
import {SDKValuePlugin, useSDKCommentDecorations} from '@portabletext/plugin-sdk-value'
import {Card, Stack} from '@sanity/ui'
import {type PropsWithChildren, useMemo, useState} from 'react'

import {CommentComposer} from './comments/CommentComposer'
import {LoadBoundary} from './comments/LoadBoundary'
import {SelectionCommentButton} from './comments/SelectionCommentButton'
import {useInlineCommentDraft} from './comments/useInlineCommentDraft'
import {ENTRY_TYPE} from './constants'

const bodySchema = defineSchema({
  decorators: [{name: 'strong'}, {name: 'em'}],
})

const bodyNodes = [
  defineTextBlock({
    type: 'block',
    render: ({attributes, children}) => <p {...attributes}>{children}</p>,
  }),
  defineDecorator({type: 'strong', render: ({children}) => <strong>{children}</strong>}),
  defineDecorator({type: 'em', render: ({children}) => <em>{children}</em>}),
]

interface EntryBodyEditorProps {
  entryId: string
  initialValue: PortableTextBlock[] | undefined
  readOnly: boolean
}

export function EntryBodyEditor({entryId, initialValue, readOnly}: EntryBodyEditorProps) {
  return (
    <EditorProvider initialConfig={{schemaDefinition: bodySchema, initialValue, readOnly}}>
      <SDKValuePlugin documentId={entryId} documentType={ENTRY_TYPE} path="body" />
      <NodePlugin nodes={bodyNodes} />
      <CommentableBody entryId={entryId} />
    </EditorProvider>
  )
}

function CommentableBody({entryId}: {entryId: string}) {
  const {commentableSelection, draft, draftDecorations, startDraft, discardDraft, submitDraft} =
    useInlineCommentDraft({documentId: entryId, documentType: ENTRY_TYPE, path: 'body'})
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const focusHandlers = {
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
  }

  return (
    <Stack gap={2}>
      <Card border radius={2} paddingX={3} paddingY={2} data-entry-field="body">
        {/* The body stays editable without highlights while the entry's comments load or fail. */}
        <LoadBoundary loading={<BodyEditable decorations={draftDecorations} {...focusHandlers} />}>
          <HighlightedBodyEditable
            entryId={entryId}
            decorations={draftDecorations}
            {...focusHandlers}
          />
        </LoadBoundary>
      </Card>
      {isEditorFocused && draft === null && commentableSelection ? (
        <SelectionCommentButton selection={commentableSelection} onClick={startDraft} />
      ) : null}
      {draft === null ? null : (
        <CommentComposer
          label="Comment on the selected text"
          onSubmit={submitDraft}
          onClose={discardDraft}
        />
      )}
    </Stack>
  )
}

interface BodyEditableProps {
  decorations: RangeDecoration[]
  onFocus: () => void
  onBlur: () => void
}

function HighlightedBodyEditable({
  entryId,
  decorations,
  ...focusHandlers
}: BodyEditableProps & {entryId: string}) {
  const commentDecorations = useSDKCommentDecorations({
    documentId: entryId,
    documentType: ENTRY_TYPE,
    path: 'body',
    renderDecoration: renderCommentHighlight,
  })
  const allDecorations = useMemo(
    () => [...commentDecorations, ...decorations],
    [commentDecorations, decorations],
  )

  return <BodyEditable decorations={allDecorations} {...focusHandlers} />
}

function BodyEditable({decorations, onFocus, onBlur}: BodyEditableProps) {
  return (
    <PortableTextEditable
      aria-label="Body"
      className="collection-entry-body"
      rangeDecorations={decorations}
      renderPlaceholder={renderBodyPlaceholder}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  )
}

function CommentHighlight({children}: PropsWithChildren) {
  return <span className="collection-entry-comment-highlight">{children}</span>
}

function renderCommentHighlight() {
  return CommentHighlight
}

function renderBodyPlaceholder() {
  return <span className="collection-entry-body-placeholder">Write the entry body</span>
}
