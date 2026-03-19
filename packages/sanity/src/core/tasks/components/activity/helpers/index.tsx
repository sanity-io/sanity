import {CalendarIcon, CircleIcon, EditIcon, LinkIcon, UserIcon} from '@sanity/icons'
import {TextSkeleton} from '@sanity/ui'
import {IntentLink} from 'sanity/router'

import {
  type RelativeTimeOptions,
  useDateTimeFormat,
  type UseDateTimeFormatOptions,
  useRelativeTime,
  useSchema,
} from '../../../../hooks'
import {usePerspective} from '../../../../perspective/usePerspective'
import {useUser} from '../../../../store'
import {TASK_STATUS} from '../../../constants'
import {useDocumentPreviewValues} from '../../../hooks'
import {type TaskTarget} from '../../../types'
import * as classes from './index.css'
import {type FieldChange} from './parseTransactions'

const DATE_FORMAT_OPTIONS: UseDateTimeFormatOptions = {
  month: 'long',
  day: '2-digit',
  minute: '2-digit',
  hour: '2-digit',
  second: '2-digit',
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {
  minimal: true,
  useTemporalPhrase: true,
}

function Strong({children}: {children: React.ReactNode}) {
  return <strong className={classes.strong}>{children}</strong>
}

export function NoWrap({children}: {children: React.ReactNode}) {
  return <span className={classes.noWrap}>{children}</span>
}

export function useUpdatedTimeAgo(timestamp: string) {
  const date = new Date(timestamp)
  const dateFormatter = useDateTimeFormat(DATE_FORMAT_OPTIONS)
  const formattedDate = dateFormatter.format(date)

  const updatedTimeAgo = useRelativeTime(date || '', RELATIVE_TIME_OPTIONS)

  return {timeAgo: updatedTimeAgo, formattedDate}
}

export function UserName({userId}: {userId: string}) {
  const [user, isLoading] = useUser(userId)
  return isLoading ? <TextSkeleton style={{width: '15ch'}} /> : <Strong>{user?.displayName}</Strong>
}

const DUE_BY_DATE_OPTIONS: UseDateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
}

function DueByChange({date}: {date: string}) {
  const dueBy = new Date(date)
  const dateFormatter = useDateTimeFormat(DUE_BY_DATE_OPTIONS)
  const formattedDate = dateFormatter.format(dueBy)

  return (
    <Strong>
      <NoWrap>{formattedDate}</NoWrap>
    </Strong>
  )
}

function TargetContentChange({target}: {target: TaskTarget}) {
  const schema = useSchema()
  const documentId = target.document._ref
  const documentType = target.documentType
  const documentSchema = schema.get(documentType)
  const {perspectiveStack} = usePerspective()
  const {isLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
    perspectiveStack,
  })

  if (isLoading) {
    return <TextSkeleton style={{width: '15ch'}} />
  }
  if (!documentSchema) {
    return null
  }

  return (
    <span className={classes.linkWrapper}>
      <IntentLink intent="edit" params={{id: documentId, type: documentType}}>
        {value?.title}
      </IntentLink>
    </span>
  )
}

export function getChangeDetails(activity: FieldChange): {
  text: string
  icon: React.JSX.Element
  changeTo?: React.JSX.Element
} {
  switch (activity.field) {
    case 'status': {
      const statusTitle = TASK_STATUS.find((s) => s.value === activity.to)?.title
      return {
        text: 'changed status to',
        icon: TASK_STATUS.find((s) => s.value === activity.to)?.icon || <CircleIcon />,
        changeTo: <Strong>{statusTitle}</Strong>,
      }
    }
    case 'target':
      if (!activity.to)
        return {
          text: 'removed target content',
          icon: <LinkIcon />,
          changeTo: undefined,
        }
      return {
        text: 'set target content to',
        icon: <LinkIcon />,
        changeTo: <TargetContentChange target={activity.to} />,
      }
    case 'dueBy':
      if (!activity.from) {
        return {
          text: 'set the due date to',
          icon: <CalendarIcon />,
          changeTo: <DueByChange date={activity.to} />,
        }
      }
      if (!activity.to) {
        return {
          text: 'removed the due date',
          icon: <CalendarIcon />,
          changeTo: undefined,
        }
      }
      return {
        text: 'changed the due date to',
        icon: <CalendarIcon />,
        changeTo: <DueByChange date={activity.to} />,
      }
    case 'assignedTo':
      if (!activity.to) {
        return {
          text: 'unassigned this task',
          icon: <UserIcon />,
          changeTo: undefined,
        }
      }
      return {
        text: 'assigned to',
        icon: <UserIcon />,
        changeTo: <UserName userId={activity.to} />,
      }
    case 'description':
      return {
        text: 'updated the task description',
        icon: <EditIcon />,
        changeTo: undefined,
      }
    case 'title':
      return {
        text: 'updated the task title',
        icon: <EditIcon />,
        changeTo: undefined,
      }
    default:
      return {
        text: '',
        icon: <CircleIcon />,
      }
  }
}
