import {CopyIcon, LinkIcon, TrashIcon} from '@sanity/icons'
import {Box, Flex, Menu, MenuDivider} from '@sanity/ui'
import {useCallback} from 'react'
import {ContextMenuButton, LoadingBlock, type ObjectInputProps} from 'sanity'
import {useTasksNavigation} from 'sanity/tasks'
import styled from 'styled-components'

import {MenuButton, MenuItem} from '../../../../../ui-components'
import {useRemoveTask} from '../../hooks/useRemoveTask'
import {type TaskDocument} from '../../types'
import {ActivityLog} from '../activityLog'
import {RemoveTaskDialog} from './RemoveTaskDialog'
import {StatusSelector} from './StatusSelector'
import {Title} from './TitleField'

const FirstRow = styled.div`
  display: flex;
  padding-bottom: 12px;
`

function FormActionsMenu({id}: {id: string}) {
  const {setViewMode, setSelectedTask} = useTasksNavigation()
  const onTaskRemoved = useCallback(() => {
    setViewMode('list')
    setSelectedTask(null)
  }, [setViewMode, setSelectedTask])
  const removeTask = useRemoveTask({id, onRemoved: onTaskRemoved})

  return (
    <>
      <Box paddingTop={3}>
        <MenuButton
          id="edit-task-menu"
          button={<ContextMenuButton />}
          menu={
            <Menu>
              <MenuItem
                text="Duplicate task"
                icon={CopyIcon}
                disabled // TODO: This is not yet implemented
              />
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

export function FormEdit(props: ObjectInputProps<TaskDocument>) {
  const statusField = props.schemaType.fields.find((f) => f.name === 'status')
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
        <FormActionsMenu id={props.value?._id} />
      </Flex>
      <FirstRow>
        <StatusSelector
          value={props.value?.status}
          path={['status']}
          onChange={props.onChange}
          options={statusField.type.options.list}
        />
      </FirstRow>
      {props.renderDefault(props)}
      <ActivityLog value={props.value} />
    </>
  )
}
