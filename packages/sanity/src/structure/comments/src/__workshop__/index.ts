import {defineScope} from '@sanity/ui-workshop'
import {lazy} from 'react'

export default defineScope({
  name: 'structure/comments',
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
      title: 'UserListWithPermissionsOptions',
      component: lazy(() => import('./UserListWithPermissionsOptionsHookStory')),
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
    {
      name: 'comment-breadcrumbs',
      title: 'CommentBreadcrumbs',
      component: lazy(() => import('./CommentBreadcrumbsStory')),
    },
    {
      name: 'comment-reactions-menu',
      title: 'CommentReactionsMenu',
      component: lazy(() => import('./CommentReactionsMenuStory')),
    },
    {
      name: 'comment-reactions-menu-button',
      title: 'CommentReactionsMenuButton',
      component: lazy(() => import('./CommentReactionsMenuButtonStory')),
    },
    {
      name: 'comment-reactions-bar',
      title: 'CommentReactionsBar',
      component: lazy(() => import('./CommentReactionsBarStory')),
    },
    {
      name: 'comment-reactions-users-tooltip-content',
      title: 'CommentReactionsUsersTooltipContent',
      component: lazy(() => import('./CommentReactionsUsersTooltipContentStory')),
    },
  ],
})
