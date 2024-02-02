/* eslint sort-keys: "error" */
import {defineLocalesResources} from 'sanity'

/**
 * Defined locale strings for the comments feature, in US English.
 *
 * @internal
 */
const commentsLocaleStrings = defineLocalesResources('comments', {
  /** The close comments button text */
  'button-close-pane-text': 'Close comments',
  /** The aria label for the close comments button */
  'button-close-pane-text-aria-label': 'Close comments',
  /** The text for the button to go to the correct field */
  'button-go-to-field-aria-label': 'Go to field',

  /** The inspector text when error copying link */
  'copy-link-error-message': 'Unable to copy link to clipboard',
  /** The inspector successfully copied link text */
  'copy-link-success-message': 'Copied link to clipboard',

  /** The delete dialog body for a comment */
  'delete-comment-body': 'Once deleted, a comment cannot be recovered.',
  /** The delete dialog confirm button text for a comment */
  'delete-comment-confirm': 'Delete comment',
  /** The delete dialog title for a comment */
  'delete-comment-title': 'Delete this comment?',
  /** The delete dialog error */
  'delete-dialog-error': 'An error occurred while deleting the comment. Please try again.',
  /** The delete dialog body for a thread */
  'delete-thread-body':
    'This comment and its replies will be deleted, and once deleted cannot be recovered.',
  /** The delete dialog conform button text for a thread */
  'delete-thread-confirm': 'Delete thread',
  /** The delete dialog title for a thread */
  'delete-thread-title': 'Delete this comment thread?',

  /** The button text for confirming discard */
  'discard-button-confirm': 'Discard',
  /** The header for discard comment dialog */
  'discard-header': 'Discard comment?',
  /** The text for discard comment dialog */
  'discard-text': 'Do you want to discard the comment?',

  /** The text for dropdown menu item for open comments */
  'dropdown-item-open': 'Open comments',
  /** The text for dropdown menu item for resolved comments */
  'dropdown-item-resolved': 'Resolved comments',
  /** The title for dropdown for open comments */
  'dropdown-title-open': 'Open',
  /** The title for dropdown for resolved comments */
  'dropdown-title-resolved': 'Resolved',

  /** The name of the comments feature, for use in header. Capitalized, eg "Comments". */
  'feature-name': 'Comments',

  /** Sharing feedback on the comments feature: The link title */
  'feedback-footer-link': 'Share your feedback',
  /** Sharing feedback on the comments feature: The form title  */
  'feedback-footer-title': 'Help improve ',

  /** The field button aria-label for add comment */
  'field-button-aria-label-add': 'Add comment',
  /** The field button aria label for open comments*/
  'field-button-aria-label-open': 'Open comments',
  /** The field button popover text when there is one comment */
  'field-button-content_one': 'View comment',
  /** The field button popover text when there are several comments*/
  'field-button-content_other': 'View comments',
  /** The field button placeholder text */
  'field-button-placeholder-text': 'Add comment to',
  /** The field button text for adding a comment */
  'field-button-title': 'Add comment',

  /** The button tooltip content for the add reaction button*/
  'list-item-context-menu-add-reaction': 'Add reaction',
  /** The button tooltip aria label for adding a reaction */
  'list-item-context-menu-add-reaction-aria-label': 'Add reaction',
  /** The action menu item for copying a comment link */
  'list-item-copy-link': 'Copy link to comment',
  /** The action menu item for deleting a comment */
  'list-item-delete-comment': 'Delete comment',
  /** The action menu item for editing a comment */
  'list-item-edit-comment': 'Edit comment',
  /** The marker to indicate that a comment has been edited in brackets */
  'list-item-layout-edited': 'edited',
  /** The error text when sending a comment has failed */
  'list-item-layout-failed-sent': 'Failed to send.',
  /** The loading message when posting a comment is in progress */
  'list-item-layout-posting': 'Posting...',
  /** The text for retrying posting a comment */
  'list-item-layout-retry': 'Retry',
  /** The aria label for the comments menu button to open the actions menu */
  'list-item-open-menu-aria-label': 'Open comment actions menu',

  /** The button text to re-open a resolved comment  */
  'list-item-re-open-resolved': 'Re-open',
  /** The button aria label to re-open a comment that is resolved */
  'list-item-re-open-resolved-aria-label': 'Re-open',
  /** The button aria label to mark a comment as resolved */
  'list-item-resolved-tooltip-aria-label': 'Mark comment as resolved',
  /** The button text to mark a comment as resolved */
  'list-item-resolved-tooltip-content': 'Mark as resolved',

  /** The empty state text for open comments */
  'list-status-empty-state-open-text': 'Open comments on this document will be shown here.',
  /** The empty state title for open comments */
  'list-status-empty-state-open-title': 'No open comments yet',
  /** The empty state text for resolved comments */
  'list-status-empty-state-resolved-text': 'Resolved comments on this document will be shown here.',
  /** The empty state title for resolved comments */
  'list-status-empty-state-resolved-title': 'No resolved comments yet',
  /** The list status message for error */
  'list-status-error': 'Something went wrong',
  /** The list status message for loading status */
  'list-status-loading': 'Loading comments',

  /** The text for no users found for mentions */
  'mentions-not-found': 'No users found',
  /** The text for unauthorized mentions */
  'mentions-unauthorized': 'Unauthorized',
  /** The aria label for the command list for users to mention */
  'mentions-user-list-aria-label': 'List of users to mention',

  /** The comments onboarding popover text */
  'onboarding-popover-body':
    "You can add comments to any field in a document. They'll show up here, grouped by field.",
  /** The comments onboarding dismiss text */
  'onboarding-popover-dismiss': 'Got it',
  /** The comments onboarding popover header text */
  'onboarding-popover-header': 'Document fields now have comments',

  /** The placeholder for adding a comment to a field title */
  'placeholder-add-comment-field-title': 'Add comment to <strong>{{field}}</strong>',
  /** The placeholder for creating a new thread to the field name */
  'placeholder-create-thread': 'Add comment to <strong>{{field}}</strong>',
  /** The placeholder for replying to a comment */
  'placeholder-reply': 'Reply',

  /** Tooltip for the button to add a reaction to a comment */
  'reactions.add-reaction-tooltip': 'Add reaction',
  /** Aria label for the individual reactions you can choose from when reacting to a comment */
  'reactions.react-with-aria-label': 'React with {{reactionName}}',
  /** When a users' name cannot be resolved, fall back to this name */
  'reactions.user-list.unknown-user-fallback-name': 'Unknown user',
  /**
   * When showing list of users who have reacted, replaces your own name with "you", eg
   * "Donna, you, James, and Tyler reacted with 👍". A different key (`_leading` suffix)
   * is used when you are the first to react, eg "You, Donna and Tyler reacted with 👍".
   * Use `{{name}}` if you want to instead use the current users' actual name.
   */
  'reactions.user-list.you': 'you',
  /**
   * When showing list of users who have reacted, replaces your own name with "You", eg
   * "You, Donna, James, and Tyler reacted with 👍". A different key (`_leading` suffix)
   * is used when you are not the first to react, eg "Donna, you, James and Tyler reacted with 👍".
   * Use `{{name}}` if you want to instead use the current users' actual name.
   */
  'reactions.user-list.you_leading': 'You',
  /**
   * The text shown for the tooltip that appears when hovering over the reaction count, eg
   * "Donna, James, and Tyler Reacted with 👍". Three components are available for use:
   * - `<UserList/>` - the list of names of users who have reacted, using the locales list format
   * - `<Text>` - should be wrapped around the text describing the action ("reacted with")
   * - `<ReactionName/>` - the name of the reaction emoji, eg ":heavy_plus_sign:"
   */
  'reactions.users-reacted-with-reaction': '<UserList/> <Text>reacted with</Text> <ReactionName/>',

  /** The thread breadcrumb button aria label */
  'thread-breadcrumb-layout-aria-label': 'Go to {{lastCrumb}} field',
  /** The tooltip text for mentioning a user */
  'tooltip-mention-user': 'Mention user',
  /** The tooltip aria label for mentioning a user */
  'tooltip-mention-user-aria-label': 'Mention user',
  /** The tooltip text for sending a comment*/
  'tooltip-send-comment': 'Send comment',
  /** The tooltip aria label for sending a comment*/
  'tooltip-send-comment-aria-label': 'Send comment',
})

/**
 * @alpha
 */
export type CommentsLocaleResourceKeys = keyof typeof commentsLocaleStrings

export default commentsLocaleStrings
