import {defineEvent} from '@sanity/telemetry'

// Task is created.
export const TaskCreated = defineEvent({
  name: 'Task Created',
  version: 1,
  description: 'A task is created',
})

// Task status changed. %from% - %to%
export const TaskStatusChanged = defineEvent<{
  from: string
  to: string
}>({
  name: 'Task Status Changed',
  version: 1,
  description: 'Task status changed',
})

// A comment is added in a task
export const TaskCommentAdded = defineEvent({
  name: 'Task comment added',
  version: 1,
  description: 'A comment was added in a task',
})

// A reply is added
export const TaskCommentReplyAdded = defineEvent({
  name: 'Task comment reply added',
  version: 1,
  description: 'A reply was added to a comment in a task',
})

// A task is duplicated
export const TaskDuplicated = defineEvent({
  name: 'Task duplicated',
  version: 1,
  description: 'A task is duplicated',
})

// A task is removed
export const TaskRemoved = defineEvent({
  name: 'Task removed',
  version: 1,
  description: 'A task is removed',
})

// The link to a task is copied
export const TaskLinkCopied = defineEvent({
  name: 'Task link copied',
  version: 1,
  description: 'The link to a task is copied',
})

// User visited the studio through a link with a task
export const TaskLinkOpened = defineEvent({
  name: 'Task link opened',
  version: 1,
  description: 'User visited the studio through a link with a task',
})
