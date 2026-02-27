import {CheckmarkCircleIcon} from '@sanity/icons'
import {useCallback, useMemo} from 'react'

import {Button} from '../../../ui-components'
import {type NavbarProps} from '../../config'
import {useTranslation} from '../../i18n'
import {useTasksEnabled, useTasksNavigation} from '../context'
import {tasksLocaleNamespace} from '../i18n'

const EMPTY_ARRAY: [] = []

const TasksToolbar = ({onClick, isOpen}: {onClick: () => void; isOpen: boolean}) => {
  const {t} = useTranslation(tasksLocaleNamespace)

  return (
    <Button
      tooltipProps={{
        content: t('toolbar.tooltip'),
      }}
      icon={CheckmarkCircleIcon}
      mode="bleed"
      onClick={onClick}
      selected={isOpen}
      data-testid="tasks-toolbar"
    />
  )
}

function TasksStudioNavbarInner(props: NavbarProps) {
  const {
    handleOpenTasks,
    handleCloseTasks,
    state: {isOpen},
  } = useTasksNavigation()

  const {t} = useTranslation(tasksLocaleNamespace)

  const handleClick = useCallback(() => {
    if (isOpen) {
      handleCloseTasks()
    } else {
      handleOpenTasks()
    }
  }, [isOpen, handleOpenTasks, handleCloseTasks])

  const renderTasksNav = useCallback(
    () => <TasksToolbar onClick={handleClick} isOpen={isOpen} />,
    [handleClick, isOpen],
  )

  const actions = useMemo((): NavbarProps['__internal_actions'] => {
    return [
      ...(props?.__internal_actions || EMPTY_ARRAY),
      {
        location: 'topbar',
        name: 'tasks-topbar',
        render: renderTasksNav,
      },
      {
        icon: CheckmarkCircleIcon,
        location: 'sidebar',
        name: 'tasks-sidebar',
        onAction: handleClick,
        selected: isOpen,
        title: t('actions.open.text'),
      },
    ]
  }, [handleClick, isOpen, props?.__internal_actions, renderTasksNav, t])

  return props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_actions: actions,
  })
}

export function TasksStudioNavbar(props: NavbarProps) {
  const {enabled} = useTasksEnabled()

  if (!enabled) {
    return props.renderDefault(props)
  }

  return <TasksStudioNavbarInner {...props} />
}
