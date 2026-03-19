import {AddIcon} from '@sanity/icons'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'

import {Button} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {type SidebarTabsIds, useTasks, useTasksEnabled, useTasksNavigation} from '../../context'
import {tasksLocaleNamespace} from '../../i18n'
import {type TaskStatus} from '../../types'
import * as classes from './EmptyStates.css'

const HEADING_BY_STATUS: Record<
  TaskStatus,
  Record<
    SidebarTabsIds,
    {
      heading: string
      text: string
    }
  >
> = {
  open: {
    assigned: {
      heading: 'empty-state.status.list.open.assigned.heading',
      text: 'empty-state.status.list.open.assigned.text',
    },
    document: {heading: 'empty-state.status.list.open.document.heading', text: ''},
    subscribed: {
      heading: 'empty-state.status.list.open.subscribed.heading',
      text: 'empty-state.status.list.open.subscribed.text',
    },
  },
  closed: {
    assigned: {
      heading: 'empty-state.status.list.closed.assigned.heading',
      text: 'empty-state.status.list.closed.assigned.text',
    },
    document: {heading: 'empty-state.status.list.closed.document.heading', text: ''},
    subscribed: {
      heading: 'empty-state.status.list.closed.subscribed.heading',
      text: 'empty-state.status.list.closed.subscribed.text',
    },
  },
}

export function EmptyStatusListState({status}: {status: TaskStatus}) {
  const {
    state: {activeTabId},
  } = useTasksNavigation()
  const {t} = useTranslation(tasksLocaleNamespace)
  const {heading, text} = HEADING_BY_STATUS[status][activeTabId]
  return (
    <Stack space={3}>
      <Text size={1} weight="semibold">
        {t(heading)}
      </Text>
      <Text size={1}>{t(text)}</Text>
    </Stack>
  )
}

const EMPTY_TASK_LIST: Record<
  SidebarTabsIds | 'noActiveDocument',
  {
    heading: string
    text: string
  }
> = {
  assigned: {
    heading: 'empty-state.list.assigned.heading',
    text: 'empty-state.list.assigned.text',
  },
  subscribed: {
    heading: 'empty-state.list.subscribed.heading',
    text: 'empty-state.list.subscribed.text',
  },
  document: {
    heading: 'empty-state.list.document.heading',
    text: 'empty-state.list.document.text',
  },
  noActiveDocument: {
    heading: 'empty-state.list.no-active-document.heading',
    text: 'empty-state.list.no-active-document.text',
  },
}

export function EmptyTasksListState() {
  const {activeDocument} = useTasks()
  const {mode} = useTasksEnabled()
  const {
    state: {activeTabId},
    setViewMode,
  } = useTasksNavigation()

  const key = !activeDocument && activeTabId === 'document' ? 'noActiveDocument' : activeTabId

  const {heading, text} = EMPTY_TASK_LIST[key]
  const {t} = useTranslation(tasksLocaleNamespace)

  const handleTaskCreate = useCallback(() => {
    setViewMode({type: 'create'})
  }, [setViewMode])
  return (
    <div className={classes.root}>
      <Flex direction={'column'} gap={3} align={'center'} flex={1} justify={'center'}>
        <Text className={classes.animatedText} key={key} size={1} weight="semibold">
          {t(heading)}
        </Text>
        <Box paddingBottom={6} paddingTop={1}>
          <Text className={classes.animatedText} key={key} size={1} align="center">
            {t(text)}
          </Text>
        </Box>
        {mode !== 'upsell' && (
          <Button
            icon={AddIcon}
            text={t('empty-state.list.create-new')}
            onClick={handleTaskCreate}
          />
        )}
      </Flex>
    </div>
  )
}
