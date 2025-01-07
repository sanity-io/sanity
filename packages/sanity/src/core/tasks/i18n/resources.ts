/* eslint sort-keys: "error" */
import {defineLocalesResources} from '../../i18n'

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
  /** The label for the button to open the draft */
  'buttons.draft.text': 'Draft',
  /** The label for the button to create a new task */
  'buttons.new.text': 'New task',
  /** The text for tooltip in the create a new task button when mode is upsell */
  'buttons.new.upsell-tooltip': 'Upgrade to create tasks',
  /** The label for the button that will navigate to the next task */
  'buttons.next.tooltip': 'Go to next task',
  /** The label for the button that will previous to the next task */
  'buttons.previous.tooltip': 'Go to previous task',
  /** Text for the remove task dialog asking for confirmation of deletion */
  'dialog.remove-task.body': 'Once deleted, a task cannot be recovered.',
  /** The label for the cancel button on the remove task dialog */
  'dialog.remove-task.buttons.cancel.text': 'Cancel',
  /** The label for the confirmation button on the remove task dialog */
  'dialog.remove-task.buttons.confirm.text': 'Delete',
  /** The title for the remove task dialog */
  'dialog.remove-task.title': 'Delete this task?',
  /** The text used as a placeholder for the footer action in a document with a single task */
  'document.footer.open-tasks.placeholder_one': 'Open task',
  /** The text used as a placeholder for the footer action in a document with multiple tasks */
  'document.footer.open-tasks.placeholder_other': 'Open tasks',
  /** The label used in the button in the footer action in a document with a single task */
  'document.footer.open-tasks.text_one': '{{count}} open task',
  /** The label used in the button in the footer action in a document with multiple tasks */
  'document.footer.open-tasks.text_other': '{{count}} open tasks',

  /** The heading in the tasks sidebar, in the assigned tab, when the user hasn't been assigned to any task*/
  'empty-state.list.assigned.heading': "You haven't been assigned any tasks",
  /** The text in the tasks sidebar, in the assigned tab, when the user hasn't been assigned to any task*/
  'empty-state.list.assigned.text': "Once you're assigned tasks they'll show up here",
  /** The text in the tasks sidebar button any of the empty states is rendered*/
  'empty-state.list.create-new': 'Create new task',
  /** The heading in the tasks sidebar, in the document tab, when the document doesn't have any task*/
  'empty-state.list.document.heading': "This document doesn't have any tasks yet",
  /** The text in the tasks sidebar, in the document tab, when the document doesn't have any task*/
  'empty-state.list.document.text': 'Once a document has connected tasks, they will be shown here.',
  /** The heading in the tasks sidebar, when viewing the document tab, but there is not an active document*/
  'empty-state.list.no-active-document.heading': 'Open a document to see its task',
  /** The text in the tasks sidebar, when viewing the document tab, but there is not an active document*/
  'empty-state.list.no-active-document.text': 'Tasks on your active document will be shown here.',
  /** The heading in the tasks sidebar, in the subscriber tab, when the user is not subscribed to any task*/
  'empty-state.list.subscribed.heading': "You haven't subscribed to any tasks",
  /** The text in the tasks sidebar, in the subscriber tab, when the user is not subscribed to any task*/
  'empty-state.list.subscribed.text':
    'When you create, modify, or comment on a task you will be subscribed automatically',

  /** The heading in the tasks sidebar, in the assigned tab, under the closed details, when it's empty.*/
  'empty-state.status.list.closed.assigned.heading': 'No completed tasks',
  /** The text in the tasks sidebar, in the assigned tab, under the closed details, when it's empty.*/
  'empty-state.status.list.closed.assigned.text': 'Your tasks marked done will show up here',
  /** The heading in the tasks sidebar, in the document tab, under the closed details, when it's empty.*/
  'empty-state.status.list.closed.document.heading': 'No completed tasks',
  /** The heading in the tasks sidebar, in the subscribed tab, under the closed details, when it's empty.*/
  'empty-state.status.list.closed.subscribed.heading': 'No completed tasks',
  /** The text in the tasks sidebar, in the subscribed tab, under the closed details, when it's empty.*/
  'empty-state.status.list.closed.subscribed.text':
    'Tasks you subscribe to marked done will show up here',

  /** The heading in the tasks sidebar, in the assigned tab, under the open details, when it's empty.*/
  'empty-state.status.list.open.assigned.heading': "You're all caught up",
  /** The text in the tasks sidebar, in the assigned tab, under the open details, when it's empty.*/
  'empty-state.status.list.open.assigned.text': 'New tasks assigned to you will show up here',
  /** The heading in the tasks sidebar, in the document tab, under the open details, when it's empty.*/
  'empty-state.status.list.open.document.heading': 'No tasks on this document',
  /** The heading in the tasks sidebar, in the subscribed tab, under the open details, when it's empty.*/
  'empty-state.status.list.open.subscribed.heading': 'No subscribed tasks',
  /** The text in the tasks sidebar, in the subscribed tab, under the open details, when it's empty.*/
  'empty-state.status.list.open.subscribed.text': 'Tasks you subscribe to will show up here',

  /** Text used in the assignee input when there is no user assigned */
  'form.input.assignee.no-user-assigned.text': 'Unassigned',
  /** Text used in the assignee input tooltip when there is no user assigned */
  'form.input.assignee.no-user-assigned.tooltip': 'Set assignee',
  /** Text used in the assignee input when searching and no users are found */
  'form.input.assignee.search.no-users.text': 'No users found',
  /** Placeholder text used in the search box in the assignee input */
  'form.input.assignee.search.placeholder': 'Select assignee',
  /** Text used in the assignee input when user is not authorized */
  'form.input.assignee.unauthorized.text': 'Unauthorized',
  /** Text used in the assignee input tooltip when there is no user assigned */
  'form.input.assignee.user-assigned.tooltip': 'Change assignee',
  /** Text used in the assignee input when user is not found */
  'form.input.assignee.user-not-found.text': 'User not found',
  /** The label used in the create more toggle */
  'form.input.create-more.text': 'Create more',
  /** The label used in the date input button tooltip when it's empty */
  'form.input.date.buttons.empty.tooltip': 'Set due date',
  /** The label used in the date input to remove the current value */
  'form.input.date.buttons.remove.text': 'Remove',
  /** The label used in the date input button tooltip when it has value */
  'form.input.date.buttons.tooltip': 'Change due date',
  /** Placeholder text used in the description input */
  'form.input.description.placeholder': 'Add description',
  /**  Text used in the tooltip in the status change button  */
  'form.input.status.button.tooltip': 'Change status',
  /** The label used in the target input to remove the current value */
  'form.input.target.buttons.remove.text': 'Remove target content',
  /** The text used in the target input when encountering a schema error */
  'form.input.target.error.schema-not-found': 'Schema not found',
  /** The placeholder text used in the target input for the search component */
  'form.input.target.search.placeholder': 'Select target document',
  /** The placeholder text for the title input */
  'form.input.title.placeholder': 'Task title',
  /** The status error message presented when the user does not supply a title */
  'form.status.error.title-required': 'Title is required',
  /** The status message upon successful creation of a task */
  'form.status.success': 'Task created',
  /** The text displayed when no tasks are found */
  'list.empty.text': 'No tasks',
  /** The text displayed at the bottom of the tasks list inviting users provide feedback */
  'list.feedback.text': 'Help us improve, <Link>share feedback on Tasks</Link> ',
  /** The label for the copy link menu item */
  'menuitem.copylink.text': 'Copy link to task',
  /** The label for the delete task menu item */
  'menuitem.delete.text': 'Delete task',
  /** The label for the duplicate task menu item */
  'menuitem.duplicate.text': 'Duplicate task',
  /** The text for the duplicate task menu item tooltip when mode is upsell */
  'menuitem.duplicate.upsell-tooltip': 'Upgrade to duplicate tasks',
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
  /** The placeholder text for the comment text box when mode is upsell */
  'panel.comment.placeholder.upsell': 'Upgrade to comment on tasks',
  /** The title used in the task panel when showing the create task form */
  'panel.create.title': 'Create',
  /** The title used in the drafts pulldown */
  'panel.drafts.title': 'Drafts',
  /** The tooltip for the task navigation component */
  'panel.navigation.tooltip': 'Open tasks',
  /** Title of the Tasks panel   */
  'panel.title': 'Tasks',

  /** Label for the Assigned Tab */
  'tab.assigned.label': 'Assigned',
  /** Label for the Active Document Tab */
  'tab.document.label': 'Active Document',
  /** Label for the Subscribed Tab */
  'tab.subscribed.label': 'Subscribed',
  /** Tooltip for the tasks navbar icon */
  'toolbar.tooltip': 'Tasks',
})

/**
 * @alpha
 */
export type TasksLocaleResourceKeys = keyof typeof tasksLocaleStrings

export default tasksLocaleStrings
