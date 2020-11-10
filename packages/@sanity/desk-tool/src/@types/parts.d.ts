/* eslint-disable import/export */

// declare module 'part:*'
// declare module 'all:part:*'

/*
 * Global and local parts
 */

declare module 'all:part:@sanity/desk-tool/after-editor-component'
declare module 'part:@sanity/desk-tool/filter-fields-fn?'
declare module 'part:@sanity/desk-tool/language-select-component?'
declare module 'part:@sanity/transitional/production-preview/resolve-production-url?'

/*
 * @sanity/base
 */

declare module 'part:@sanity/base/actions/utils'
declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/datastore/document'
declare module 'part:@sanity/base/datastore/presence'

declare module 'all:part:@sanity/base/diff-resolver' {
  import {ComponentType} from 'react'

  type DiffComponent = ComponentType<unknown>
  type DiffResolver = (schemaType: unknown) => DiffComponent | undefined

  const diffResolvers: DiffResolver[]
  export default diffResolvers
}

declare module 'part:@sanity/base/document-actions/resolver'
declare module 'part:@sanity/base/document-badges/resolver'
declare module 'part:@sanity/base/preview'

declare module 'part:@sanity/base/router' {
  // @todo: replace all of this with:
  // export * from '@sanity/base/src/router'

  export * from '@sanity/state-router'

  type IntentLinkProps = any

  interface StateLinkProps {
    ref?: any
    state?: Record<string, any>
    toIndex?: boolean
  }

  type IntentParameters = Record<string, any> | [Record<string, any>, Record<string, any>]

  type RouterState = Record<string, any>

  export type Router<S = Record<any, any>> = {
    navigate: (nextState: Record<string, any>, options?: NavigateOptions) => void
    navigateIntent: (
      intentName: string,
      params?: IntentParameters,
      options?: NavigateOptions
    ) => void
    state: S
  }

  export const useRouter: () => Router
  export const IntentLink: React.ComponentType<IntentLinkProps>
  export const StateLink: React.ComponentType<StateLinkProps>

  export const withRouterHOC: (source: React.ComponentType<any>) => React.ComponentType<any>
}

declare module 'part:@sanity/base/schema'
declare module 'part:@sanity/base/user'
declare module 'part:@sanity/base/util/document-action-utils'
declare module 'part:@sanity/base/util/draft-utils'

// icons
declare module 'part:@sanity/base/angle-down-icon' {
  export {default} from '@sanity/base/src/components/icons/AngleDownIcon'
}
declare module 'part:@sanity/base/angle-up-icon' {
  export {default} from '@sanity/base/src/components/icons/AngleUpIcon'
}
declare module 'part:@sanity/base/arrow-drop-down' {
  export {default} from '@sanity/base/src/components/icons/ArrowDropDown'
}
declare module 'part:@sanity/base/arrow-right' {
  export {default} from '@sanity/base/src/components/icons/ArrowRight'
}
declare module 'part:@sanity/base/bars-icon' {
  export {default} from '@sanity/base/src/components/icons/Bars'
}
declare module 'part:@sanity/base/binary-icon' {
  export {default} from '@sanity/base/src/components/icons/Binary'
}
declare module 'part:@sanity/base/block-object-icon' {
  export {default} from '@sanity/base/src/components/icons/BlockObject'
}
declare module 'part:@sanity/base/calendar-icon' {
  export {default} from '@sanity/base/src/components/icons/Calendar'
}
declare module 'part:@sanity/base/check-icon' {
  export {default} from '@sanity/base/src/components/icons/Check'
}
declare module 'part:@sanity/base/chevron-down-icon' {
  export {default} from '@sanity/base/src/components/icons/ChevronDown'
}
declare module 'part:@sanity/base/clipboard-icon' {
  export {default} from '@sanity/base/src/components/icons/Clipboard'
}
declare module 'part:@sanity/base/clipboard-image-icon' {
  export {default} from '@sanity/base/src/components/icons/ClipboardImage'
}
declare module 'part:@sanity/base/close-icon' {
  export {default} from '@sanity/base/src/components/icons/CloseIcon'
}
declare module 'part:@sanity/base/circle-check-icon' {
  export {default} from '@sanity/base/src/components/icons/CheckCircle'
}
declare module 'part:@sanity/base/circle-thin-icon' {
  export {default} from '@sanity/base/src/components/icons/CircleThin'
}
declare module 'part:@sanity/base/cog-icon' {
  export {default} from '@sanity/base/src/components/icons/Cog'
}
declare module 'part:@sanity/base/comment-icon' {
  export {default} from '@sanity/base/src/components/icons/Comment'
}
declare module 'part:@sanity/base/compose-icon' {
  export {default} from '@sanity/base/src/components/icons/Compose'
}
declare module 'part:@sanity/base/content-copy-icon' {
  export {default} from '@sanity/base/src/components/icons/ContentCopy'
}
declare module 'part:@sanity/base/danger-icon' {
  export {default} from '@sanity/base/src/components/icons/Danger'
}
declare module 'part:@sanity/base/drag-handle-icon' {
  export {default} from '@sanity/base/src/components/icons/DragHandle'
}
declare module 'part:@sanity/base/edit-icon' {
  export {default} from '@sanity/base/src/components/icons/Edit'
}
declare module 'part:@sanity/base/error-icon' {
  export {default} from '@sanity/base/src/components/icons/Error'
}
declare module 'part:@sanity/base/error-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/ErrorOutline'
}
declare module 'part:@sanity/base/warning-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/WarningOutline'
}
declare module 'part:@sanity/base/eye-icon' {
  export {default} from '@sanity/base/src/components/icons/Eye'
}
declare module 'part:@sanity/base/file-icon' {
  export {default} from '@sanity/base/src/components/icons/File'
}
declare module 'part:@sanity/base/folder-icon' {
  export {default} from '@sanity/base/src/components/icons/Folder'
}
declare module 'part:@sanity/base/format-bold-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatBold'
}
declare module 'part:@sanity/base/format-code-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatCode'
}
declare module 'part:@sanity/base/format-italic-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatItalic'
}
declare module 'part:@sanity/base/format-list-bulleted-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatListBulleted'
}
declare module 'part:@sanity/base/format-list-numbered-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatListNumbered'
}
declare module 'part:@sanity/base/format-quote-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatQuote'
}
declare module 'part:@sanity/base/format-strikethrough-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatStrikethrough'
}
declare module 'part:@sanity/base/format-underlined-icon' {
  export {default} from '@sanity/base/src/components/icons/FormatUnderlined'
}
declare module 'part:@sanity/base/fullscreen-icon' {
  export {default} from '@sanity/base/src/components/icons/Fullscreen'
}
declare module 'part:@sanity/base/fullscreen-exit-icon' {
  export {default} from '@sanity/base/src/components/icons/FullscreenExit'
}
declare module 'part:@sanity/base/hamburger-icon' {
  export {default} from '@sanity/base/src/components/icons/Hamburger'
}
declare module 'part:@sanity/base/history-icon' {
  export {default} from '@sanity/base/src/components/icons/History'
}
declare module 'part:@sanity/base/image-area-icon' {
  export {default} from '@sanity/base/src/components/icons/ImageArea'
}
declare module 'part:@sanity/base/image-icon' {
  export {default} from '@sanity/base/src/components/icons/Image'
}
declare module 'part:@sanity/base/images-icon' {
  export {default} from '@sanity/base/src/components/icons/Images'
}
declare module 'part:@sanity/base/info-icon' {
  export {default} from '@sanity/base/src/components/icons/Info'
}
declare module 'part:@sanity/base/inline-object-icon' {
  export {default} from '@sanity/base/src/components/icons/InlineObject'
}
declare module 'part:@sanity/base/launch-icon' {
  export {default} from '@sanity/base/src/components/icons/Launch'
}
declare module 'part:@sanity/base/lightbulb-icon' {
  export {default} from '@sanity/base/src/components/icons/Lightbulb'
}
declare module 'part:@sanity/base/link-icon' {
  export {default} from '@sanity/base/src/components/icons/Link'
}
declare module 'part:@sanity/base/more-vert-icon' {
  export {default} from '@sanity/base/src/components/icons/MoreVert'
}
declare module 'part:@sanity/base/package-icon' {
  export {default} from '@sanity/base/src/components/icons/Package'
}
declare module 'part:@sanity/base/paste-icon' {
  export {default} from '@sanity/base/src/components/icons/Paste'
}
declare module 'part:@sanity/base/plugin-icon' {
  export {default} from '@sanity/base/src/components/icons/Plug'
}
declare module 'part:@sanity/base/plus-icon' {
  export {default} from '@sanity/base/src/components/icons/Plus'
}
declare module 'part:@sanity/base/plus-circle-icon' {
  export {default} from '@sanity/base/src/components/icons/PlusCircle'
}
declare module 'part:@sanity/base/plus-circle-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/PlusCircleOutline'
}
declare module 'part:@sanity/base/public-icon' {
  export {default} from '@sanity/base/src/components/icons/Public'
}
declare module 'part:@sanity/base/publish-icon' {
  export {default} from '@sanity/base/src/components/icons/Publish'
}
declare module 'part:@sanity/base/question-icon' {
  export {default} from '@sanity/base/src/components/icons/Question'
}
declare module 'part:@sanity/base/reset-icon' {
  export {default} from '@sanity/base/src/components/icons/Reset'
}
declare module 'part:@sanity/base/sanity-logo-icon' {
  export {default} from '@sanity/base/src/components/icons/SanityLogo'
}
declare module 'part:@sanity/base/search-icon' {
  export {default} from '@sanity/base/src/components/icons/Search'
}
declare module 'part:@sanity/base/sign-out-icon' {
  export {default} from '@sanity/base/src/components/icons/SignOut'
}
declare module 'part:@sanity/base/spinner-icon' {
  export {default} from '@sanity/base/src/components/icons/SpinnerIcon'
}
declare module 'part:@sanity/base/split-horizontal-icon' {
  export {default} from '@sanity/base/src/components/icons/SplitHorizontal'
}
declare module 'part:@sanity/base/sort-alpha-desc-icon' {
  export {default} from '@sanity/base/src/components/icons/SortAlphaDesc'
}
declare module 'part:@sanity/base/sort-icon' {
  export {default} from '@sanity/base/src/components/icons/Sort'
}
declare module 'part:@sanity/base/stack-compact-icon' {
  export {default} from '@sanity/base/src/components/icons/StackCompact'
}
declare module 'part:@sanity/base/stack-icon' {
  export {default} from '@sanity/base/src/components/icons/Stack'
}
declare module 'part:@sanity/base/sync-icon' {
  export {default} from '@sanity/base/src/components/icons/Sync'
}
declare module 'part:@sanity/base/th-large-icon' {
  export {default} from '@sanity/base/src/components/icons/ThLarge'
}
declare module 'part:@sanity/base/th-list-icon' {
  export {default} from '@sanity/base/src/components/icons/ThList'
}
declare module 'part:@sanity/base/time-icon' {
  export {default} from '@sanity/base/src/components/icons/Time'
}
declare module 'part:@sanity/base/trash-icon' {
  export {default} from '@sanity/base/src/components/icons/Trash'
}
declare module 'part:@sanity/base/trash-outline-icon' {
  export {default} from '@sanity/base/src/components/icons/TrashOutline'
}
declare module 'part:@sanity/base/truncate-icon' {
  export {default} from '@sanity/base/src/components/icons/Truncate'
}
declare module 'part:@sanity/base/undo-icon' {
  export {default} from '@sanity/base/src/components/icons/Undo'
}
declare module 'part:@sanity/base/unpublish-icon' {
  export {default} from '@sanity/base/src/components/icons/Unpublish'
}
declare module 'part:@sanity/base/upload-icon' {
  export {default} from '@sanity/base/src/components/icons/Upload'
}
declare module 'part:@sanity/base/user-icon' {
  export {default} from '@sanity/base/src/components/icons/User'
}
declare module 'part:@sanity/base/users-icon' {
  export {default} from '@sanity/base/src/components/icons/UsersIcon'
}
declare module 'part:@sanity/base/visibility-off-icon' {
  export {default} from '@sanity/base/src/components/icons/VisibilityOff'
}
declare module 'part:@sanity/base/view-column-icon' {
  export {default} from '@sanity/base/src/components/icons/ViewColumn'
}
declare module 'part:@sanity/base/visibility-icon' {
  export {default} from '@sanity/base/src/components/icons/Visibility'
}
declare module 'part:@sanity/base/warning-icon' {
  export {default} from '@sanity/base/src/components/icons/Warning'
}

/*
 * @sanity/components
 */

declare module 'part:@sanity/components/avatar' {
  export * from '@sanity/base/src/__legacy/@sanity/components/avatar'
}

declare module 'part:@sanity/components/badges/default' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/badges/DefaultBadge'
}

declare module 'part:@sanity/components/buttons/button-grid-style'
declare module 'part:@sanity/components/buttons/button-grid' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/buttons/ButtonGrid'
}

declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/default' {
  export * from '@sanity/base/src/__legacy/@sanity/components/buttons/DefaultButton'
  export {default} from '@sanity/base/src/__legacy/@sanity/components/buttons/DefaultButton'
}
declare module 'part:@sanity/components/buttons/intent' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/buttons/IntentButton'
}

declare module 'part:@sanity/components/click-outside' {
  export * from '@sanity/base/src/__legacy/@sanity/components/clickOutside'
}

declare module 'part:@sanity/components/container-query' {
  export * from '@sanity/base/src/__legacy/@sanity/components/containerQuery'
}

declare module 'part:@sanity/components/dialogs/content-style'
declare module 'part:@sanity/components/dialogs/content' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/dialogs/DialogContent'
}

declare module 'part:@sanity/components/dialogs/default-style'
declare module 'part:@sanity/components/dialogs/default' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/dialogs/DefaultDialog'
}

declare module 'part:@sanity/components/dialogs/fullscreen-style'
declare module 'part:@sanity/components/dialogs/fullscreen' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/dialogs/FullscreenDialog'
}

declare module 'part:@sanity/components/dialogs/popover-style'
declare module 'part:@sanity/components/dialogs/popover' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/dialogs/PopoverDialog'
}

declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/loading/spinner' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/loading/Spinner'
}

declare module 'part:@sanity/components/menu-button' {
  export * from '@sanity/base/src/__legacy/@sanity/components/menuButton'
}

declare module 'part:@sanity/components/menus/default-style'
declare module 'part:@sanity/components/menus/default' {
  export * from '@sanity/base/src/__legacy/@sanity/components/menus/DefaultMenu'
  export {default} from '@sanity/base/src/__legacy/@sanity/components/menus/DefaultMenu'
}

declare module 'part:@sanity/components/layer' {
  export * from '@sanity/base/src/__legacy/@sanity/components/layer'
}

declare module 'part:@sanity/components/panes/default' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/panes/DefaultPane'
}

declare module 'part:@sanity/components/popover' {
  export * from '@sanity/base/src/__legacy/@sanity/components/popover'
}

declare module 'part:@sanity/components/portal' {
  export * from '@sanity/base/src/__legacy/@sanity/components/portal'
}

declare module 'part:@sanity/components/scroll' {
  export * from '@sanity/base/src/__legacy/@sanity/components/scroll'
}

declare module 'part:@sanity/components/snackbar/default' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/snackbar/DefaultSnackbar'
}

declare module 'part:@sanity/components/tabs/tab' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/tabs/Tab'
}

declare module 'part:@sanity/components/tabs/tab-list' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/tabs/TabList'
}

declare module 'part:@sanity/components/tabs/tab-panel' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/tabs/TabPanel'
}

declare module 'part:@sanity/components/tooltip' {
  export * from '@sanity/base/src/__legacy/@sanity/components/tooltip'
}

declare module 'part:@sanity/components/typography/hotkeys' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/typography/Hotkeys'
}

declare module 'part:@sanity/components/utilities/escapable' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/utilities/Escapable'
}

declare module 'part:@sanity/components/validation/list' {
  export {default} from '@sanity/base/src/__legacy/@sanity/components/validation/ValidationList'
}

/*
 * @sanity/form-builder
 */

declare module 'part:@sanity/form-builder'
