import {CommentIcon} from '@sanity/icons'
import {PortableTextBlock} from '@sanity/types'
import {Box, Button, Popover, Stack, Text, TextArea} from '@sanity/ui'
import React, {ChangeEvent, useCallback, useState} from 'react'
import {RenderBlockActionsCallback} from 'sanity'
import {commentStore} from './CustomContentInput'

export const renderBlockActions: RenderBlockActionsCallback = (props) => {
  const {block} = props
  return <CommentButton value={block} />
}

function CommentButton(props: {value: PortableTextBlock}) {
  const {value} = props
  const [open, setOpen] = useState(false)
  const [comment, setComment] = useState('')

  const handleCommentChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setComment(event.currentTarget.value)
  }, [])

  const handleSubmit = useCallback(() => {
    setOpen(false)
    if (comment) {
      commentStore[value._key] = (commentStore[value._key] || []).concat(comment)
    }
    setComment('')
  }, [comment, value])

  const handleClick = useCallback(() => setOpen(true), [])

  const content = open && (
    <Box padding={3}>
      <Stack space={2}>
        {(commentStore[value._key] || []).map((c: any, i: number) => {
          return (
            <Box padding={1} key={`comment-${i}`}>
              {JSON.stringify(c)}
            </Box>
          )
        })}
      </Stack>
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
