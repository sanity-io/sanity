import {type ReleaseDocument} from '@sanity/client'
import {EditIcon, EyeOpenIcon, SparklesIcon, TextIcon} from '@sanity/icons'
import {Menu, useToast, type ToastContextValue} from '@sanity/ui'
import {useCallback, useEffect, useState} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n'
import {releasesLocaleNamespace} from '../../../i18n'
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
  const {t} = useTranslation(releasesLocaleNamespace)
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

  const buttonLabel = t('agent-actions.button.label')

  useErrorToast(summaryAction.error, t('toast.generate-summary.error'), toast)
  useErrorToast(titleAction.error, t('toast.generate-title.error'), toast)
  useErrorToast(reviewAction.error, t('toast.review.error'), toast)

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
            tooltipProps={{content: buttonLabel}}
            aria-label={buttonLabel}
          />
        }
        menu={
          <Menu>
            <MenuItem
              icon={EditIcon}
              onClick={titleAction.generate}
              text={t('action.generate-title')}
              data-testid="agent-action-generate-title"
            />
            <MenuItem
              icon={TextIcon}
              onClick={summaryAction.generate}
              text={t('action.generate-summary')}
              data-testid="agent-action-generate-summary"
            />
            <MenuItem
              icon={EyeOpenIcon}
              onClick={handleReviewClick}
              text={t('action.review')}
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
