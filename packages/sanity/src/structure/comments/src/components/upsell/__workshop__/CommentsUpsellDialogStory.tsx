import {useCallback, useEffect} from 'react'
import {CommentIcon} from '@sanity/icons'
import {CommentsUpsellProvider} from '../../../context'
import {useCommentsUpsell} from '../../../hooks'
import {Button} from '../../../../../../ui-components'

const CommentsUpsellDialogStoryInner = () => {
  const {upsellData, setUpsellDialogOpen} = useCommentsUpsell()
  const handleOpen = useCallback(() => {
    setUpsellDialogOpen(true)
  }, [setUpsellDialogOpen])

  useEffect(() => {
    setUpsellDialogOpen(true)
  }, [setUpsellDialogOpen])

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
