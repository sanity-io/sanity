/* eslint sort-keys: "error" */
import {defineLocalesResources} from '../../i18n'

/**
 * Defined locale strings for the comments feature, in US English.
 *
 * @internal
 */
const commentsLocaleStrings = defineLocalesResources('comments', {
  /** The close comments button text */
  'close-pane-button-text': 'Close comments',
  /** The aria label for the close comments button */
  'close-pane-button-text-aria-label': 'Close comments',

  /** When composing a comment, the placeholder text shown when adding a comment to a field with no current comments */
  'compose.add-comment-input-placeholder': 'Add comment to <strong>{{field}}</strong>',
  /** When composing a comment, the placeholder text shown when adding a comment to a field with no current comments and the mode is upsell */
  'compose.add-comment-input-placeholder-upsell': 'Upgrade to add comment',
  /** When composing a comment, the placeholder text shown when the input is empty */
  'compose.create-comment-placeholder': 'Create a new comment',
  /** When composing a comment, the aria label for the button to mention a user */
  'compose.mention-user-aria-label': 'Mention user',
  /** When composing a comment, the tooltip text for the button to mention a user */
  'compose.mention-user-tooltip': 'Mention user',
  /** When composing a reply, the placeholder text shown when the input is empty */
  'compose.reply-placeholder': 'Reply',
  /** When composing a reply, the placeholder text shown when the input is empty and the mode is upsell */
  'compose.reply-placeholder-upsell': 'Upgrade to reply',
  /** When composing a comment, the aria label for the button to send a comment */
  'compose.send-comment-aria-label': 'Send comment',
  /** When composing a comment, the tooltip text for the button to send a comment */
  'compose.send-comment-tooltip': 'Send comment',

  /** The inspector text when error copying link */
  'copy-link-error-message': 'Unable to copy link to clipboard',

  /** The delete dialog body for a comment */
  'delete-comment.body': 'Once deleted, a comment cannot be recovered.',
  /** The delete dialog confirm button text for a comment */
  'delete-comment.confirm': 'Delete comment',
  /** The delete dialog title for a comment */
  'delete-comment.title': 'Delete this comment?',
  /** The delete dialog error */
  'delete-dialog.error': 'An error occurred while deleting the comment. Please try again.',
  /** The delete dialog body for a thread */
  'delete-thread.body':
    'This comment and its replies will be deleted, and once deleted cannot be recovered.',
  /** The delete dialog conform button text for a thread */
  'delete-thread.confirm': 'Delete thread',
  /** The delete dialog title for a thread */
  'delete-thread.title': 'Delete this comment thread?',

  /** The button text for confirming discard */
  'discard.button-confirm': 'Discard',
  /** The header for discard comment dialog */
  'discard.header': 'Discard comment?',
  /** The text for discard comment dialog */
  'discard.text': 'Do you want to discard the comment?',

  /** Sharing feedback on the comments feature: The link title */
  'feature-feedback.link': 'Share your feedback',
  /** Sharing feedback on the comments feature: The form title  */
  'feature-feedback.title': 'Help improve ',

  /** The name of the comments feature, for use in header. Capitalized, eg "Comments". */
  'feature-name': 'Comments',

  /** Aria label for button above fields to add a comment, when the field currently do not have any comments */
  'field-button.aria-label-add': 'Add comment',
  /** Aria label for button above fields that opens the comments for this field, when there are existing comments */
  'field-button.aria-label-open': 'Open comments',
  /** Text shown in popover when hovering the button above fields that opens the comments panel, when there is a single comment present */
  'field-button.content_one': 'View comment',
  /** Text shown in popover when hovering the button above fields that opens the comments panel, when there are more than one comment present */
  'field-button.content_other': 'View comments',
  /** Text shown in popover when hovering the button above fields to add a comment, when the field currently do not have any comments */
  'field-button.title': 'Add comment',

  /* The text shown in the inline comment button when the button is disabled due to overlap */
  'inline-add-comment-button.disabled-overlap-title': 'Comments cannot overlap',
  /** The text shown in the inline comment button */
  'inline-add-comment-button.title': 'Add comment',

  /** Aria label for the breadcrumb button showing the field path. `{{field}}` is the last (most specific) field. */
  'list-item.breadcrumb-button-go-to-field-aria-label': 'Go to {{field}} field',
  /** The button tooltip content for the add reaction button */
  'list-item.context-menu-add-reaction': 'Add reaction',
  /** The button tooltip aria label for adding a reaction */
  'list-item.context-menu-add-reaction-aria-label': 'Add reaction',
  /** The button tooltip content for the add reaction button and mode is upsell */
  'list-item.context-menu-add-reaction-upsell': 'Upgrade to add reaction',
  /** The action menu item for copying a comment link */
  'list-item.copy-link': 'Copy link to comment',
  /** The action menu item for deleting a comment */
  'list-item.delete-comment': 'Delete comment',
  /** The action menu item for editing a comment */
  'list-item.edit-comment': 'Edit comment',
  /** The action menu item for editing a comment and the mode is upsell */
  'list-item.edit-comment-upsell': 'Upgrade to edit comment',
  /** Aria label for the button that takes you to the field, which wraps a thread/comment */
  'list-item.go-to-field-button.aria-label': 'Go to field',
  /**
   * The text shown below the author and timestamp of a comment including a link back to the context in which the comment was made.
   * Consists of a document title wrapped in a link, and a word or phrase to indicate that the link refers to a location:
   * eg "on Home", "on Coffee Machine | Products", "on Pricing – Sanity"
   */
  'list-item.layout-context': 'on <IntentLink>{{title}}</IntentLink>',
  /** The marker to indicate that a comment has been edited in brackets */
  'list-item.layout-edited': 'edited',
  /** The error text when sending a comment has failed */
  'list-item.layout-failed-sent': 'Failed to send.',
  /** The loading message when posting a comment is in progress */
  'list-item.layout-posting': 'Posting...',
  /** The text for retrying posting a comment */
  'list-item.layout-retry': 'Retry',
  /** The text shown when the value a comment references has been deleted */
  'list-item.missing-referenced-value-tooltip-content': 'The commented text has been deleted',
  /** The aria label for the comments menu button to open the actions menu */
  'list-item.open-menu-aria-label': 'Open comment actions menu',
  /** The button text to re-open a resolved comment  */
  'list-item.re-open-resolved': 'Re-open',
  /** The button aria label to re-open a comment that is resolved */
  'list-item.re-open-resolved-aria-label': 'Re-open',
  /** The button aria label to mark a comment as resolved */
  'list-item.resolved-tooltip-aria-label': 'Mark comment as resolved',
  /** The button text to mark a comment as resolved */
  'list-item.resolved-tooltip-content': 'Mark as resolved',

  /** The empty state text for open comments */
  'list-status.empty-state-open-text': 'Open comments on this document will be shown here.',
  /** The empty state title for open comments */
  'list-status.empty-state-open-title': 'No open comments yet',
  /** The empty state text for resolved comments */
  'list-status.empty-state-resolved-text': 'Resolved comments on this document will be shown here.',
  /** The empty state title for resolved comments */
  'list-status.empty-state-resolved-title': 'No resolved comments yet',
  /** The list status message for error */
  'list-status.error': 'Something went wrong',
  /** The list status message for loading status */
  'list-status.loading': 'Loading comments',

  /** Text shown when no users can be found to mention */
  'mentions.no-users-found': 'No users found',
  /** Label/badge shown for users that are not authorized to see the document, and thus cannot be mentioned */
  'mentions.unauthorized-user': 'Unauthorized',
  /** Aria label for the command list for users to mention */
  'mentions.user-list-aria-label': 'List of users to mention',

  /** The comments onboarding popover text */
  'onboarding.body':
    "You can add comments to any field in a document. They'll show up here, grouped by field.",
  /** The comments onboarding dismiss text */
  'onboarding.dismiss': 'Got it',
  /** The comments onboarding popover header text */
  'onboarding.header': 'Document fields now have comments',

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

  /** Status filter: The short title describing filtering on open (non-resolved) comments */
  'status-filter.status-open': 'Open',
  /** Status filter: The full text for describing filtering on open (non-resolved) comments */
  'status-filter.status-open-full': 'Open comments',
  /** Status filter: The short title describing filtering on resolved comments */
  'status-filter.status-resolved': 'Resolved',
  /** Status filter: The full text for describing filtering on resolved comments */
  'status-filter.status-resolved-full': 'Resolved comments',
  /** Status filter: The full text for describing filtering on resolved comments and is upsell mode */
  'status-filter.status-resolved-full-upsell': 'Upgrade to see resolved comments',
})

/**
 * @alpha
 */
export type CommentsLocaleResourceKeys = keyof typeof commentsLocaleStrings

export default commentsLocaleStrings
