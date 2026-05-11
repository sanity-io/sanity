import {type ReleaseDocument} from '@sanity/client'
import {EditIcon, SearchIcon, SparklesIcon, TextIcon} from '@sanity/icons'
import {Menu, useToast} from '@sanity/ui'
import {useEffect} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {useGenerateReleaseSummary} from './useGenerateReleaseSummary'
import {useGenerateReleaseTitle} from './useGenerateReleaseTitle'

interface AgentActionsMenuProps {
  release: ReleaseDocument
}

const NOOP = () => {}

export function AgentActionsMenu({release}: AgentActionsMenuProps): React.JSX.Element {
  const summaryAction = useGenerateReleaseSummary(release)
  const titleAction = useGenerateReleaseTitle(release)
  const toast = useToast()

  const isAnyActionRunning = summaryAction.isGenerating || titleAction.isGenerating

  useEffect(() => {
    if (summaryAction.error === null) return
    toast.push({
      status: 'error',
      title: 'Failed to generate release description',
      description: summaryAction.error.message,
    })
  }, [summaryAction.error, toast])

  useEffect(() => {
    if (titleAction.error === null) return
    toast.push({
      status: 'error',
      title: 'Failed to generate release title',
      description: titleAction.error.message,
    })
  }, [titleAction.error, toast])

  return (
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
            icon={TextIcon}
            onClick={summaryAction.generate}
            text="Generate summary"
            data-testid="agent-action-generate-summary"
          />
          <MenuItem icon={SearchIcon} onClick={NOOP} text="Review changes" disabled />
          <MenuItem
            icon={EditIcon}
            onClick={titleAction.generate}
            text="Generate title"
            data-testid="agent-action-generate-title"
          />
        </Menu>
      }
      popover={{placement: 'bottom-end'}}
    />
  )
}
