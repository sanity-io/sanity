/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the comments plugin, in US English.
 *
 * @internal
 */
const commentsLocaleStrings = defineLocalesResources('comments', {
  /**The close comments button text */
  'comments.button-close-pane-text': 'Close comments',
  /**The aria label for the close comments button */
  'comments.button-close-pane-text-aria-label': 'Close comments',
  /**The text for the button to go to the correct field */
  'comments.button-go-to-field-aria-label': 'Go to field',

  /**The inspector text when error copying link */
  'comments.copy-link-error-message': 'Unable to copy link to clipboard',
  /**The inspector successfully copied link text */
  'comments.copy-link-success-message': 'Copied link to clipboard',

  /**The delete dialog body for a comment */
  'comments.delete-comment-body': 'Once deleted, a comment cannot be recovered.',
  /**The delete dialog confirm button text for a comment */
  'comments.delete-comment-confirm': 'Delete comment',
  /**The delete dialog title for a comment */
  'comments.delete-comment-title': 'Delete this comment?',
  /**The delete dialog error */
  'comments.delete-dialog-error': 'An error occurred while deleting the comment. Please try again.',
  /**The delete dialog body for a thread */
  'comments.delete-thread-body':
    'This comment and its replies will be deleted, and once deleted cannot be recovered.',
  /**The delete dialog conform button text for a thread */
  'comments.delete-thread-confirm': 'Delete thread',
  /**The delete dialog title for a thread */
  'comments.delete-thread-title': 'Delete this comment thread?',

  /**The button text for confirming discard */
  'comments.discard-button-confirm': 'Discard',
  /**The header for discard comment dialog */
  'comments.discard-header': 'Discard comment?',
  /**The text for discard comment dialog */
  'comments.discard-text': 'Do you want to discard the comment?',

  /**The document inspector title for comments */
  'comments.document-inspector-title': 'Comments',

  /**The text for dropdown menu item for open comments */
  'comments.dropdown-item-open': 'Open comments',
  /**The text for dropdown menu item for resolved comments */
  'comments.dropdown-item-resolved': 'Resolved comments',
  /**The title for dropdown for open comments */
  'comments.dropdown-title-open': 'Open',
  /**The title for dropdown for resolved comments */
  'comments.dropdown-title-resolved': 'Resolved',

  /**The feedback form footer link to sharing feedback */
  'comments.feedback-footer-link': 'Share your feedback',
  /**The feedback form footer title */
  'comments.feedback-footer-title': 'Help improve comments.',

  /**The field button aria-label for add comment */
  'comments.field-button-aria-label-add': 'Add comment',
  /**The field button aria label for open comments*/
  'comments.field-button-aria-label-open': 'Open comments',
  /**The field button popover text when there is one comment */
  'comments.field-button-content_one': 'View comment',
  /**The field button popover text when there are several comments*/
  'comments.field-button-content_other': 'View comments',
  /**The field button placeholder text */
  'comments.field-button-placeholder-text': 'Add comment to',
  /**The field button text for adding a comment */
  'comments.field-button-title': 'Add comment',

  /**The comments pane header title */
  'comments.header-title': 'Comments',

  /**The button tooltip content for the add reaction button*/
  'comments.list-item-context-menu-add-reaction': 'Add reaction',
  /**The button tooltip aria label for adding a reaction */
  'comments.list-item-context-menu-add-reaction-aria-label': 'Add reaction',
  /**The action menu item for copying a comment link */
  'comments.list-item-copy-link': 'Copy link to comment',
  /**The action menu item for deleting a comment */
  'comments.list-item-delete-comment': 'Delete comment',
  /**The action menu item for editing a comment */
  'comments.list-item-edit-comment': 'Edit comment',
  /**The marker to indicate that a comment has been edited in brackets */
  'comments.list-item-layout-edited': 'edited',
  /**The error text when sending a comment has failed */
  'comments.list-item-layout-failed-sent': 'Failed to send.',
  /**The loading message when posting a comment is in progress */
  'comments.list-item-layout-posting': 'Posting...',
  /**The text for retrying posting a comment */
  'comments.list-item-layout-retry': 'Retry',
  /**The aria label for the comments menu button to open the actions menu */
  'comments.list-item-open-menu-aria-label': 'Open comment actions menu',

  /**The button text to re-open a resolved comment  */
  'comments.list-item-re-open-resolved': 'Re-open',
  /**The button aria label to re-open a comment that is resolved */
  'comments.list-item-re-open-resolved-aria-label': 'Re-open',
  /**The button aria label to mark a comment as resolved */
  'comments.list-item-resolved-tooltip-aria-label': 'Mark comment as resolved',
  /**The button text to mark a comment as resolved */
  'comments.list-item-resolved-tooltip-content': 'Mark as resolved',

  /**The empty state text for open comments */
  'comments.list-status-empty-state-open-text':
    'Open comments on this document will be shown here.',
  /**The empty state title for open comments */
  'comments.list-status-empty-state-open-title': 'No open comments yet',
  /**The empty state text for resolved comments */
  'comments.list-status-empty-state-resolved-text':
    'Resolved comments on this document will be shown here.',
  /**The empty state title for resolved comments */
  'comments.list-status-empty-state-resolved-title': 'No resolved comments yet',
  /**The list status message for error */
  'comments.list-status-error': 'Something went wrong',
  /**The list status message for loading status */
  'comments.list-status-loading': 'Loading comments',

  /**The text for no users found for mentions */
  'comments.mentions-not-found': 'No users found',
  /**The text for unauthorized mentions */
  'comments.mentions-unauthorized': 'Unauthorized',
  /**The aria label for the command list for users to mention */
  'comments.mentions-user-list-aria-label': 'List of users to mention',

  /**The comments onboarding popover text */
  'comments.onboarding-popover-body':
    'You can add comments to any field in a document. They`ll show up here, grouped by field.',
  /**The comments onboarding dismiss text */
  'comments.onboarding-popover-dismiss': 'Got it',
  /**The comments onboarding popover header text */
  'comments.onboarding-popover-header': 'Document fields now have comments',

  /**The placeholder for adding a comment to a field title */
  'comments.placeholder-add-comment-field-title': 'Add comment to <Strong>{{fieldTitle}}</Strong>',
  /**The placeholder for creating a new thread to the field name */
  'comments.placeholder-create-thread': 'Add comment to <Strong>{{fieldName}}</Strong>',
  /**The placeholder for replying to a comment */
  'comments.placeholder-reply': 'Reply',
  /**The comment reaction bar tooltip text */
  'comments.reaction-bar-tooltip': 'Add reaction',
  /**Separator for several reactions */
  'comments.reaction-separator': 'and ',

  /**The tooltip text for unknown user */
  'comments.reaction-unknown-user': 'Unknown user',
  /**This is the tooltip text for when you are the user that has reacted */
  'comments.reaction-user-you': 'You',
  /**This is the tooltip lowercase text for when you are the user that has reacted */
  'comments.reaction-user-you-lowercase': 'you',
  /**The aria label for the reactions menu button */
  'comments.reactions-menu-button-aria-label': 'React with {{reaction}}',
  /**The thread breadcrumb button aria label */
  'comments.thread-breadcrumb-layout-aria-label': 'Go to {{lastCrumb}} field',
  /**The tooltip text for mentioning a user */
  'comments.tooltip-mention-user': 'Mention user',
  /**The tooltip aria label for mentioning a user */
  'comments.tooltip-mention-user-aria-label': 'Mention user',
  /**The tooltip text for sending a comment*/
  'comments.tooltip-send-comment': 'Send comment',
  /**The tooltip aria label for sending a comment*/
  'comments.tooltip-send-comment-aria-label': 'Send comment',
  /**The reactions that the user has reacted with */
  'comments.user-reacted-with':
    '<Content/> <Text>reacted with </Text> <ReactionName>{{reactionName}}</ReactionName>',
})

/**
 * @alpha
 */
export type CommentsLocaleResourceKeys = keyof typeof commentsLocaleStrings

export default commentsLocaleStrings
