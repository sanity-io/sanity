import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'core/comments',
  title: 'comments',
  stories: [
    {
      name: 'comments-provider',
      title: 'CommentsProvider',
      component: lazy(() => import('./CommentsProviderStory')),
    },
    {
      name: 'comments-input',
      title: 'CommentsInput',
      component: lazy(() => import('./CommentInputStory')),
    },
    {
      name: 'mention-options-hook',
      title: 'useMentionOptions',
      component: lazy(() => import('./MentionOptionsHookStory')),
    },
    {
      name: 'comments-list',
      title: 'CommentsList',
      component: lazy(() => import('./CommentsListStory')),
    },
    {
      name: 'mentions-menu',
      title: 'MentionsMenu',
      component: lazy(() => import('./MentionsMenuStory')),
    },
    {
      name: 'comment-delete-dialog',
      title: 'CommentDeleteDialog',
      component: lazy(() => import('./CommentDeleteDialogStory')),
    },
  ],
})
