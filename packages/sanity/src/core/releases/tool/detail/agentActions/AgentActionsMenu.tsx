import {type ReleaseDocument} from '@sanity/client'
import {EditIcon, EyeOpenIcon, SparklesIcon, TextIcon} from '@sanity/icons'
import {Menu, useToast, type ToastContextValue} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {ReleaseReviewDialog} from './ReleaseReviewDialog'
import {useGenerateReleaseReview} from './useGenerateReleaseReview'
import {useGenerateReleaseSummary} from './useGenerateReleaseSummary'
import {useGenerateReleaseTitle} from './useGenerateReleaseTitle'

interface AgentActionsMenuProps {
  release: ReleaseDocument
}

function useErrorToast(error: Error | null, title: string, toast: ToastContextValue): void {
  useEffect(() => {
    if (error === null) return
    toast.push({
      status: 'error',
      title,
      description: error.message,
    })
  }, [error, title, toast])
}

export function AgentActionsMenu({release}: AgentActionsMenuProps): React.JSX.Element {
  const summaryAction = useGenerateReleaseSummary(release)
  const titleAction = useGenerateReleaseTitle(release)
  const reviewAction = useGenerateReleaseReview(release)
  const toast = useToast()
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const isAnyActionRunning =
    summaryAction.isGenerating || titleAction.isGenerating || reviewAction.isGenerating

  const handleReviewClick = useCallback(() => {
    void reviewAction.generate()
    setIsReviewOpen(true)
  }, [reviewAction])

  useErrorToast(summaryAction.error, 'Failed to generate release description', toast)
  useErrorToast(titleAction.error, 'Failed to generate release title', toast)
  useErrorToast(reviewAction.error, 'Failed to generate release review', toast)

  return (
    <>
      <MenuButton
        id="release-agent-actions"
        button={
          <Button
            data-testid="release-agent-actions-button"
            icon={SparklesIcon}
            mode="bleed"
            loading={isAnyActionRunning}
            disabled={isAnyActionRunning}
            tooltipProps={{content: 'AI actions'}}
            aria-label="AI actions"
          />
        }
        menu={
          <Menu>
            <MenuItem
              icon={EditIcon}
              onClick={titleAction.generate}
              text="Generate title"
              data-testid="agent-action-generate-title"
            />
            <MenuItem
              icon={TextIcon}
              onClick={summaryAction.generate}
              text="Generate summary"
              data-testid="agent-action-generate-summary"
            />
            <MenuItem
              icon={EyeOpenIcon}
              onClick={handleReviewClick}
              text="Review changes"
              data-testid="agent-action-review-changes"
            />
          </Menu>
        }
        popover={{placement: 'bottom-end'}}
      />
      {isReviewOpen && (
        <ReleaseReviewDialog
          release={release}
          reviewAction={reviewAction}
          onClose={() => setIsReviewOpen(false)}
        />
      )}
    </>
  )
}
