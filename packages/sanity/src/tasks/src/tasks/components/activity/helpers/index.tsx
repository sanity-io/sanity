import {hues} from '@sanity/color'
import {
  CalendarIcon,
  CheckmarkCircleIcon,
  CircleIcon,
  EditIcon,
  LinkIcon,
  UserIcon,
} from '@sanity/icons'
import {type ReactElement} from 'react'
import {useDateTimeFormat, useRelativeTime} from 'sanity'
import styled, {css} from 'styled-components'

interface KeyStringMapValue {
  string: string
  icon: ReactElement
  link?: ReactElement
}

export function UpdatedTimeAgo(timestamp: string) {
  const dateFormatter = useDateTimeFormat({
    dateStyle: 'medium',
  })
  const formattedDate = dateFormatter.format(new Date(timestamp))

  const updatedTimeAgo = useRelativeTime(formattedDate || '', {
    minimal: true,
    useTemporalPhrase: true,
  })

  return {timeAgo: updatedTimeAgo, formattedDate}
}

export function getStringForKey(key: string): KeyStringMapValue | undefined {
  const keyStringMap: {[key: string]: KeyStringMapValue} = {
    assignedTo: {string: 'assigned to', icon: <UserIcon />},
    unassigned: {string: 'unassigned this task', icon: <UserIcon />},
    dueDate: {string: 'changed the due date to', icon: <CalendarIcon />},
    dueDateSet: {
      string: 'set the due date to',
      icon: <CalendarIcon />,
    },
    description: {string: 'updated the task description', icon: <EditIcon />},
    title: {string: 'updated the task title', icon: <EditIcon />},
    targetContent: {string: 'set the target content to', icon: <LinkIcon />},
    statusDone: {
      string: 'changed status to',
      icon: <CheckmarkCircleIcon />,
    },
    status: {
      string: 'changed status to',
      icon: <CircleIcon />,
    },
  }

  return keyStringMap[key]
}

export const IconWrapper = styled.div(({theme}) => {
  const dark = theme.sanity.color.dark
  const bg = hues.green[dark ? 400 : 600].hex

  return css`
    background-color: ${bg};
    border-radius: 50%;
    width: 16px;
    height: 16px;
  `
})
