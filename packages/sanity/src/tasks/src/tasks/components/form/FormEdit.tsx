import {CopyIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuDivider} from '@sanity/ui'
import {useCallback} from 'react'
import {ContextMenuButton, LoadingBlock, type ObjectInputProps} from 'sanity'
import styled from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {useTasksNavigation} from '../../context'
import {useRemoveTask} from '../../hooks/useRemoveTask'
import {type TaskDocument} from '../../types'
import {ActivityLog} from '../activityLog'
import {AssigneeEditFormField} from './mentionUser/AssigneeEditFormField'
import {RemoveTaskDialog} from './RemoveTaskDialog'
import {StatusSelector} from './StatusSelector'
import {Title} from './TitleField'

const FirstRow = styled(Flex)``

function FormActionsMenu({id, value}: {id: string; value: TaskDocument}) {
  const {setViewMode} = useTasksNavigation()
  const onTaskRemoved = useCallback(() => {
    setViewMode({type: 'list'})
  }, [setViewMode])
  const removeTask = useRemoveTask({id, onRemoved: onTaskRemoved})

  const duplicateTask = useCallback(() => {
    setViewMode({type: 'duplicate', duplicateTaskValues: value})
  }, [setViewMode, value])

  return (
    <>
      <Box paddingTop={3}>
        <MenuButton
          id="edit-task-menu"
          button={<ContextMenuButton />}
          menu={
            <Menu>
              <MenuItem text="Duplicate task" icon={CopyIcon} onClick={duplicateTask} />
              <MenuItem
                text="Copy link to task"
                icon={LinkIcon}
                disabled // TODO: This is not yet implemented
              />
              <MenuDivider />
              <MenuItem
                text="Delete task"
                icon={TrashIcon}
                onClick={removeTask.handleOpenDialog}
                tone="critical"
              />
            </Menu>
          }
        />
      </Box>
      <RemoveTaskDialog {...removeTask} />
    </>
  )
}

export function FormEdit(props: ObjectInputProps) {
  const statusField = props.schemaType.fields.find((f) => f.name === 'status')
  const value = props.value as TaskDocument

  if (!statusField) {
    throw new Error('Status field not found')
  }
  if (!props.value?._id) {
    return <LoadingBlock />
  }

  return (
    <>
      <Flex align="flex-start" gap={3}>
        <div style={{flex: 1}}>
          <Title
            onChange={props.onChange}
            value={props.value?.title}
            path={['title']}
            placeholder="Task title"
          />
        </div>
        <FormActionsMenu id={props.value?._id} value={value} />
      </Flex>
      <FirstRow paddingBottom={3} gap={2} align="flex-start" justify="flex-start">
        <StatusSelector
          value={props.value?.status}
          path={['status']}
          onChange={props.onChange}
          options={statusField.type.options.list}
        />
        <AssigneeEditFormField
          value={props.value?.assignedTo}
          onChange={props.onChange}
          path={['assignedTo']}
        />
      </FirstRow>
      {props.renderDefault(props)}
      <ActivityLog value={value} onChange={props.onChange} path={['subscribers']} />
    </>
  )
}
