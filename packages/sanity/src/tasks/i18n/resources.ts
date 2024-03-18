/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the task tool, in US English.
 *
 * @internal
 */
const tasksLocaleStrings = defineLocalesResources('tasks', {
  /** The label for the create task action */
  'actions.create.text': 'Create new task',
  /** The label for the open tasks panel action */
  'actions.open.text': 'Tasks',
  /** The label for the button to create a new task */
  'buttons.create.text': 'Create Task',
  /** The label for the button to discard changes */
  'buttons.discard.text': 'Discard',
  /** The label for the button to create a new task */
  'buttons.new.text': 'New task',
  /** The label for the button that will navigate to the next task */
  'buttons.next.tooltip': 'Go to next task',
  /** The label for the button that will previous to the next task */
  'buttons.previous.tooltip': 'Go to previous task',
  /** Text for the remove task dialog asking for confirmation of deletion */
  'dialog.remove-task.body': 'Are you sure you want to delete this task?',
  /** Text for the remove task dialog clarifying that deletion is permanent */
  'dialog.remove-task.body2': 'Once deleted, it cannot be restored.',
  /** The label for the cancel button on the remove task dialog */
  'dialog.remove-task.buttons.cancel.text': 'Cancel',
  /** The label for the confirmation button on the remove task dialog */
  'dialog.remove-task.buttons.confirm.text': 'Remove',
  /** The title for the remove task dialog */
  'dialog.remove-task.title': 'Remove task',
  /** The text used as a placeholder for the footer action in a document with a single task */
  'document.footer.open-tasks.placeholder_one': 'Open task',
  /** The text used as a placeholder for the footer action in a document with multiple tasks */
  'document.footer.open-tasks.placeholder_other': 'Open tasks',
  /** The label used in the button in the footer action in a document with a single task */
  'document.footer.open-tasks.text_one': '{{count}} open task',
  /** The label used in the button in the footer action in a document with multiple tasks */
  'document.footer.open-tasks.text_other': '{{count}} open tasks',
  /** Text used in the assignee input when there is no user assigned */
  'form.input.assignee.no-user-assigned.text': 'Not assigned',
  /** Text used in the assignee input when searching and no users are found */
  'form.input.assignee.search.no-users.text': 'No users found',
  /** Placeholder text used in the search box in the assignee input */
  'form.input.assignee.search.placeholder': 'Search username',
  /** Text used in the assignee input when user is not authorized */
  'form.input.assignee.unauthorized.text': 'Unauthorized',
  /** Text used in the assignee input when user is not found */
  'form.input.assignee.user-not-found.text': 'User not found',
  /** The label used in the create more toggle */
  'form.input.create-more.text': 'Create more',
  /** The label used in the date input to remove the current value */
  'form.input.date.buttons.remove.text': 'Remove',
  /** Placeholder text used in the description input */
  'form.input.description.placeholder': 'Optional additional description',
  /** The label used in the target input to remove the current value */
  'form.input.target.buttons.remove.text': 'Remove target content',
  /** The text used in the target input when encountering a schema error */
  'form.input.target.error.schema-not-found': 'Schema not found',
  /** The placeholder text used in the target input for the search component */
  'form.input.target.search.placeholder': 'Search document',
  /** The placeholder text for the title input */
  'form.input.title.placeholder': 'Task title',
  /** The status error message presented when the user does not supply a title */
  'form.status.error.title-required': 'Title is required',
  /** The status message upon successful creation of a task */
  'form.status.success': 'Task created',
  /** The text displayed when no tasks are found */
  'list.empty.text': 'No tasks',
  /** The label for the copy link menu item */
  'menuitem.copylink.text': 'Copy link to task',
  /** The label for the delete task menu item */
  'menuitem.delete.text': 'Delete task',
  /** The label for the duplicate task menu item */
  'menuitem.duplicate.text': 'Duplicate task',
  /** Fragment used to construct the first entry in the activity log */
  'panel.activity.created-fragment': 'created this task',
  /** The title of the activity section of the task */
  'panel.activity.title': 'Activity',
  /** The text used in the activity log when unable to find the user */
  'panel.activity.unknown-user': 'Unknown user',
  /** The tooltip for the close button for the task panel */
  'panel.close.tooltip': 'Close sidebar',
  /** The placeholder text for the comment text box */
  'panel.comment.placeholder': 'Add a comment...',
  /** The title used in the task panel when showing the create task form */
  'panel.create.title': 'Create',
  /** The help text used in the draft menu*/
  'panel.drafts.helptext': 'continue working on your drafts',
  /** The default title of a draft task */
  'panel.drafts.item.untitled': 'Untitled',
  /** The title used in the drafts pulldown */
  'panel.drafts.title': 'Drafts',
  /** The tooltip for the task navigation component */
  'panel.navigation.tooltip': 'Open tasks',
  /** Title of the Tasks panel   */
  'panel.title': 'Tasks',
})

/**
 * @alpha
 */
export type TasksLocaleResourceKeys = keyof typeof tasksLocaleStrings

export default tasksLocaleStrings
