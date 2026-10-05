import {Button, Card, Flex, Stack, Text, TextArea} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {type KeyboardEvent, useState} from 'react'

// A block per line: comment renderers draw blocks as paragraphs but collapse newlines inside a span.
function toCommentMessage(text: string) {
  return text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => ({
      _type: 'block',
      _key: uuid(),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: uuid(), text: line, marks: []}],
    }))
}

export interface CommentSubmission {
  message: ReturnType<typeof toCommentMessage>
  commentId: string
}

interface CommentComposerProps {
  label: string
  onSubmit: (submission: CommentSubmission) => Promise<unknown>
  onClose: () => void
}

export function CommentComposer({label, onSubmit, onClose}: CommentComposerProps) {
  const [text, setText] = useState('')
  // Kept across retries: the SDK writes with `createIfNotExists`, so a retry never duplicates a comment.
  const [commentId] = useState(() => uuid())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isBlank = text.trim().length === 0

  async function submit() {
    if (isBlank || isSubmitting) return

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      await onSubmit({message: toCommentMessage(text), commentId})
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The comment could not be saved.')
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      void submit()
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      if (isSubmitting) return
      onClose()
    }
  }

  return (
    <Card border radius={2} padding={2} shadow={1}>
      <Stack gap={2}>
        <TextArea
          aria-label={label}
          autoFocus
          placeholder={label}
          rows={3}
          value={text}
          readOnly={isSubmitting}
          onChange={(event) => setText(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        {errorMessage === null ? null : (
          <Card tone="critical" radius={2} padding={2}>
            <Text size={1}>{errorMessage}</Text>
          </Card>
        )}
        <Flex gap={2} justify="flex-end">
          <Button mode="bleed" text="Cancel" disabled={isSubmitting} onClick={onClose} />
          <Button
            tone="primary"
            text="Comment"
            disabled={isBlank}
            loading={isSubmitting}
            onClick={submit}
          />
        </Flex>
      </Stack>
    </Card>
  )
}
