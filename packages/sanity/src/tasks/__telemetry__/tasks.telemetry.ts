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

// A task is duplicated
export const TaskDuplicated = defineEvent({
  name: 'Task Duplicated',
  version: 1,
  description: 'A task is duplicated',
})

// A task is removed
export const TaskRemoved = defineEvent({
  name: 'Task Removed',
  version: 1,
  description: 'A task is removed',
})

// The link to a task is copied
export const TaskLinkCopied = defineEvent({
  name: 'Task Link Copied',
  version: 1,
  description: 'The link to a task is copied',
})

// User visited the studio through a link with a task
export const TaskLinkOpened = defineEvent({
  name: 'Task Link Opened',
  version: 1,
  description: 'User visited the studio through a link with a task',
})
