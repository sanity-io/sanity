import {
  CalendarIcon,
  CheckmarkCircleIcon,
  CircleIcon,
  EditIcon,
  LinkIcon,
  UserIcon,
} from '@sanity/icons'
import {type ReactElement} from 'react'
import {
  type RelativeTimeOptions,
  useDateTimeFormat,
  type UseDateTimeFormatOptions,
  useRelativeTime,
} from 'sanity'

interface KeyStringMapValue {
  string: string
  icon: ReactElement
  link?: ReactElement
}

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  dateStyle: 'medium',
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

export function UpdatedTimeAgo(timestamp: string) {
  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)
  const formattedDate = dateFormatter.format(new Date(timestamp))

  const updatedTimeAgo = useRelativeTime(formattedDate || '', RELATIVE_TIME_OPTIONS)

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
