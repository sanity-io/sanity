import {useCallback, useEffect} from 'react'
import {CommentIcon} from '@sanity/icons'
import {CommentsUpsellProvider} from '../../../context'
import {useCommentsUpsell} from '../../../hooks'
import {Button} from '../../../../../../ui-components'

const CommentsUpsellDialogStoryInner = () => {
  const {upsellData, handleOpenDialog} = useCommentsUpsell()
  const handleOpen = useCallback(() => {
    handleOpenDialog()
  }, [handleOpenDialog])

  useEffect(() => {
    handleOpenDialog()
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
