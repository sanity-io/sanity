/* eslint-disable import/export */

declare module 'part:@sanity/components/autocomplete/default-style'
declare module 'part:@sanity/components/buttons/button-grid-style'
declare module 'part:@sanity/components/buttons/default-style'
declare module 'part:@sanity/components/buttons/dropdown-style'
declare module 'part:@sanity/components/buttons/in-input-style'
declare module 'part:@sanity/components/dialogs/content-style'
declare module 'part:@sanity/components/dialogs/default-style'
declare module 'part:@sanity/components/dialogs/fullscreen-style'
declare module 'part:@sanity/components/dialogs/popover-style'
declare module 'part:@sanity/components/fieldsets/default-style'
declare module 'part:@sanity/components/fileinput/button'
declare module 'part:@sanity/components/edititem/fold-style'
declare module 'part:@sanity/components/formfields/default-style'
declare module 'part:@sanity/components/labels/default-style'
declare module 'part:@sanity/components/loading/spinner-style'
declare module 'part:@sanity/components/menus/default-style'
declare module 'part:@sanity/components/previews/block-image-style'
declare module 'part:@sanity/components/previews/block-style'
declare module 'part:@sanity/components/previews/card-style'
declare module 'part:@sanity/components/previews/default-style'
declare module 'part:@sanity/components/previews/detail-style'
declare module 'part:@sanity/components/previews/inline-style'
declare module 'part:@sanity/components/previews/media-style'
declare module 'part:@sanity/components/progress/bar-style'
declare module 'part:@sanity/components/progress/circle-style'
declare module 'part:@sanity/components/selects/custom-style'
declare module 'part:@sanity/components/selects/default-style'
declare module 'part:@sanity/components/selects/searchable-style'
declare module 'part:@sanity/components/selects/style-style'
declare module 'part:@sanity/components/tags/textfield-style'
declare module 'part:@sanity/components/textareas/default-style'
declare module 'part:@sanity/components/textfields/default-style'
declare module 'part:@sanity/components/textfields/search-style'
declare module 'part:@sanity/components/textinputs/default-style'
declare module 'part:@sanity/components/toggles/buttons-style'

/*
 * @sanity/base
 */

declare module 'part:@sanity/base/theme/typography/headings-style'
declare module 'part:@sanity/base/theme/typography/text-blocks-style'

declare module 'part:@sanity/base/brand-logo?' {
  const BrandLogo: React.ComponentType<{}> | undefined
  export default BrandLogo
}

declare module 'part:@sanity/base/router' {
  export * from '@sanity/base/src/router'
}

// logos
declare module 'part:@sanity/base/sanity-logo' {
  export {default} from '@sanity/base/src/components/logos/SanityLogo'
}
declare module 'part:@sanity/base/sanity-logo-alpha' {
  export {default} from '@sanity/base/src/components/logos/SanityLogoAlpha'
}
declare module 'part:@sanity/base/sanity-studio-logo' {
  export {default} from '@sanity/base/src/components/logos/SanityStudioLogo'
}

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

///////////////////////////////////////////////////////////////////////////////////////////////////
// Because `@sanity/components` depends on `@sanity/base` we need these "ambient" definitions
///////////////////////////////////////////////////////////////////////////////////////////////////
declare module 'part:@sanity/base/client'
declare module 'part:@sanity/base/authentication-fetcher'
declare module 'part:@sanity/base/user'
