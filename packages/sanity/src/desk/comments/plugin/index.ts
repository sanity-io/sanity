import {commentsInspector} from './inspector'
import {CommentField} from './field'
import {CommentsLayout} from './layout'
import {defineLocaleResourceBundle, definePlugin} from 'sanity'

export const comments = definePlugin({
  name: 'sanity/desk/comments',
  document: {
    inspectors: [commentsInspector],
  },
  form: {
    components: {
      field: CommentField,
    },
  },
  studio: {
    components: {
      layout: CommentsLayout,
    },
  },

  i18n: {
    bundles: [
      defineLocaleResourceBundle({
        locale: 'en-US',
        namespace: 'sanity/desk/comments',
        resources: {
          'header.title': 'Comments',
          'header.status-menu-button.open-text': 'Open',
          'header.status-menu-button.resolved-text': 'Resolved',
          'header.status-menu-button.menu-item-open-text': 'Open comments',
          'header.status-menu-button.menu-item-resolved-text': 'Resolved comments',

          'comment-input.placeholder.new-comment': 'Add comment to {{fieldName}}',
          'comment-input.placeholder.reply': 'Reply',
          'comment-input.discard-dialog.title': 'Discard comment?',
          'comment-input.discard-dialog.message': 'Do you want to discard the comment?',
          'comment-input.discard-dialog.confirm-button-text': 'Discard',
          'comment-input.discard-dialog.cancel-button-text': 'Cancel',
          'comment-input.mention-menu.no-results-text': 'No results',

          'comment-item.action-menu.resolve-button-text': 'Resolve comment',
          'comment-item.action-menu.open-button-text': 'Re-open ',
          'comment-item.action-menu.delete-button-text': 'Delete comment',
          'comment-item.action-menu.edit-button-text': 'Edit comment',
          'comment-item.action-menu.copy-link-button-text': 'Copy link to comment',
          'comment-item.action-menu.copy-link-toast-text': 'Link copied to clipboard',
        },
      }),
    ],
  },
})
