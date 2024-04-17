import {CommentIcon} from '@sanity/icons'
import {useCallback, useEffect} from 'react'

import {Button} from '../../../../../ui-components'
import {CommentsUpsellProvider} from '../../../context'
import {useCommentsUpsell} from '../../../hooks'

const CommentsUpsellDialogStoryInner = () => {
  const {upsellData, handleOpenDialog} = useCommentsUpsell()
  const handleOpen = useCallback(() => {
    handleOpenDialog('field_action')
  }, [handleOpenDialog])

  useEffect(() => {
    handleOpenDialog('field_action')
  }, [handleOpenDialog])

  if (!upsellData) return null

  return (
    <Button
      icon={CommentIcon}
      mode="bleed"
      onClick={handleOpen}
      tooltipProps={{
        content: 'add comment',
      }}
    />
  )
}

const CommentsUpsellDialogStory = () => {
  return (
    <CommentsUpsellProvider>
      <CommentsUpsellDialogStoryInner />
    </CommentsUpsellProvider>
  )
}

export default CommentsUpsellDialogStory
