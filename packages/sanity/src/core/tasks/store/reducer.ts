import {type TaskDocument, type TaskPostPayload} from '../types'

interface TaskAddedAction {
  payload: TaskDocument | TaskPostPayload
  type: 'TASK_ADDED'
}

interface TaskDeletedAction {
  id: string
  type: 'TASK_DELETED'
}

interface TaskUpdatedAction {
  payload: TaskDocument | Partial<TaskPostPayload>
  type: 'TASK_UPDATED'
}

interface TasksSetAction {
  tasks: TaskDocument[]
  type: 'TASKS_SET'
}

interface TaskReceivedAction {
  payload: TaskDocument
  type: 'TASK_RECEIVED'
}

export type TasksReducerAction =
  | TaskAddedAction
  | TaskDeletedAction
  | TaskUpdatedAction
  | TasksSetAction
  | TaskReceivedAction

export interface TasksReducerState {
  tasks: Record<string, TaskDocument>
}

/**
 * Transform an array of tasks into an object with the task id as key:
 * ```
 * {
 *  'task-1': { _id: 'task-1', ... },
 *  'task-2': { _id: 'task-2', ... },
 * }
 * ```
 */
function createTasksSet(tasks: TaskDocument[]) {
  const tasksById = tasks.reduce((acc, task) => ({...acc, [task._id]: task}), {})
  return tasksById
}

export function tasksReducer(
  state: TasksReducerState,
  action: TasksReducerAction,
): TasksReducerState {
  switch (action.type) {
    case 'TASKS_SET': {
      // Create an object with the task id as key
      const tasksById = createTasksSet(action.tasks)

      return {
        ...state,
        tasks: tasksById,
      }
    }

    case 'TASK_ADDED': {
      const nextTaskResult = action.payload as TaskDocument
      const nextTaskValue = nextTaskResult satisfies TaskDocument

      const nextTask = {
        [nextTaskResult._id]: {
          ...state.tasks[nextTaskResult._id],
          ...nextTaskValue,
          _state: nextTaskResult._state || undefined,
          // If the task is created optimistically, it won't have a createdAt date as this is set on the server.
          // However, we need to set a createdAt date to be able to sort the tasks correctly.
          // Therefore, we set the createdAt date to the current date here if it's missing while creating the task.
          // Once the task is created and received from the server, the createdAt date will be updated to the correct value.
          _createdAt: nextTaskResult._createdAt || new Date().toISOString(),
        } satisfies TaskDocument,
      }

      return {
        ...state,
        tasks: {
          ...state.tasks,
          ...nextTask,
        },
      }
    }

    case 'TASK_RECEIVED': {
      const nextTaskResult = action.payload as TaskDocument

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [nextTaskResult._id]: nextTaskResult,
        },
      }
    }

    case 'TASK_DELETED': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {[action.id]: _, ...restTasks} = state.tasks

      return {
        ...state,
        tasks: restTasks,
      }
    }

    case 'TASK_UPDATED': {
      const updatedTask = action.payload
      const id = updatedTask._id as string
      const task = state.tasks[id]

      const nextTask = {
        // Add existing task data
        ...task,
        // Add incoming task data
        ...updatedTask,
      } satisfies TaskDocument

      return {
        ...state,
        tasks: {
          ...state.tasks,
          [id]: nextTask,
        },
      }
    }

    default:
      return state
  }
}
