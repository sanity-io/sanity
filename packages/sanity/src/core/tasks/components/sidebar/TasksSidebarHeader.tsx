import {AddIcon, ChevronRightIcon, CloseIcon} from '@sanity/icons'
import {
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useCallback} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {useTasksEnabled, useTasksNavigation} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskDocument} from '../../types'
import {TasksActiveTabNavigation} from './TasksActiveTabNavigation'
import {TasksHeaderDraftsMenu} from './TasksHeaderDraftsMenu'

interface TasksSidebarHeaderProps {
  items: TaskDocument[]
}

/**
 * @internal
 */
export function TasksSidebarHeader(props: TasksSidebarHeaderProps) {
  const {items: allItems} = props
  const {mode} = useTasksEnabled()
  const {state, setViewMode, handleCloseTasks} = useTasksNavigation()
  const {viewMode, activeTabId} = state

  const handleTaskCreate = useCallback(() => {
    setViewMode({type: 'create'})
  }, [setViewMode])

  const handleGoBack = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])

  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <Flex justify="space-between" align="center" gap={1}>
      <Flex align="center" flex={1}>
        {viewMode === 'list' ? (
          <Box padding={2}>
            <Text size={2} weight="semibold">
              {t('panel.title')}
            </Text>
          </Box>
        ) : (
          <>
            <UIButton mode="bleed" space={2} padding={2} onClick={handleGoBack}>
              <Text size={1}>{t('panel.title')}</Text>
            </UIButton>
            <ChevronRightIcon />
            <Box paddingX={2}>
              <Text size={1} weight="semibold" style={{textTransform: 'capitalize'}}>
                {viewMode === 'create' || viewMode === 'draft'
                  ? t('panel.create.title')
                  : activeTabId}
              </Text>
            </Box>
          </>
        )}
      </Flex>
      {(viewMode === 'create' || viewMode === 'draft') && <TasksHeaderDraftsMenu />}
      {viewMode === 'edit' && <TasksActiveTabNavigation items={allItems} />}
      <Flex gap={1}>
        {viewMode === 'list' && (
          <Button
            icon={AddIcon}
            onClick={handleTaskCreate}
            mode="bleed"
            text={t('buttons.new.text')}
            disabled={mode === 'upsell'}
            tooltipProps={
              mode === 'upsell'
                ? {
                    content: t('buttons.new.upsell-tooltip'),
                  }
                : undefined
            }
          />
        )}

        <Button
          tooltipProps={{
            content: t('panel.close.tooltip'),
          }}
          iconRight={CloseIcon}
          mode="bleed"
          onClick={handleCloseTasks}
        />
      </Flex>
    </Flex>
  )
}
