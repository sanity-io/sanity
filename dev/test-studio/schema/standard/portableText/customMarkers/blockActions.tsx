import {CommentIcon} from '@sanity/icons'
import {PortableTextBlock} from '@sanity/portable-text-editor'
import {Box, Button, Popover, Stack, Text, TextArea} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {RenderBlockActionsCallback} from 'sanity'

export const renderBlockActions: RenderBlockActionsCallback = (props) => {
  const {block, set} = props

  return <CommentButton set={set} value={block} />
}

function CommentButton(props: {set: (block: PortableTextBlock) => void; value: PortableTextBlock}) {
  const {set, value} = props
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')

  const handleCommentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.currentTarget.value)
  }, [])

  const handleSubmit = useCallback(() => {
    const comments = (value.comments || []).concat(comment)

    setOpen(false)
    setComment('')
    set({...value, comments})
  }, [comment, set, value])

  const handleClick = useCallback(() => setOpen(true), [])

  const content = open && (
    <Box padding={3}>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Comment
        </Text>
        <TextArea onChange={handleCommentChange} value={comment} />
        <Button
          fontSize={1}
          onClick={handleSubmit}
          padding={2}
          text="Post comment"
          tone="primary"
        />
      </Stack>
    </Box>
  )

  return (
    <Popover content={content} open={open} portal="default">
      <Button icon={CommentIcon} mode="bleed" onClick={handleClick} padding={1} />
    </Popover>
  )
}
