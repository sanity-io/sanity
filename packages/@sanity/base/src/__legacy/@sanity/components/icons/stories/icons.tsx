import {Container} from 'part:@sanity/storybook/components'
import React from 'react'

import styles from './icons.css'

// Icons
import AngleDownIcon from 'part:@sanity/base/angle-down-icon'
import AngleUpIcon from 'part:@sanity/base/angle-up-icon'
import ArrowDropDownIcon from 'part:@sanity/base/arrow-drop-down'
import ArrowRightIcon from 'part:@sanity/base/arrow-right'
import BarsIcon from 'part:@sanity/base/bars-icon'
import BinaryIcon from 'part:@sanity/base/binary-icon'
import BlockObjectIcon from 'part:@sanity/base/block-object-icon'
import CalendarIcon from 'part:@sanity/base/calendar-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import ClipboardIcon from 'part:@sanity/base/clipboard-icon'
import ClipboardImageIcon from 'part:@sanity/base/clipboard-image-icon'
import CloseIcon from 'part:@sanity/base/close-icon'
import CircleCheckIcon from 'part:@sanity/base/circle-check-icon'
import CircleThinIcon from 'part:@sanity/base/circle-thin-icon'
import CogIcon from 'part:@sanity/base/cog-icon'
import CommentIcon from 'part:@sanity/base/comment-icon'
import ComposeIcon from 'part:@sanity/base/compose-icon'
import ContentCopyIcon from 'part:@sanity/base/content-copy-icon'
import DangerIcon from 'part:@sanity/base/danger-icon'
import DragHandleIcon from 'part:@sanity/base/drag-handle-icon'
import EditIcon from 'part:@sanity/base/edit-icon'
import ErrorIcon from 'part:@sanity/base/error-icon'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import EyeIcon from 'part:@sanity/base/eye-icon'
import FileIcon from 'part:@sanity/base/file-icon'
import FolderIcon from 'part:@sanity/base/folder-icon'
import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatCodeIcon from 'part:@sanity/base/format-code-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import FormatQuoteIcon from 'part:@sanity/base/format-quote-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import FullscreenExitIcon from 'part:@sanity/base/fullscreen-exit-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import HistoryIcon from 'part:@sanity/base/history-icon'
import ImageAreaIcon from 'part:@sanity/base/image-area-icon'
import ImageIcon from 'part:@sanity/base/image-icon'
import ImagesIcon from 'part:@sanity/base/images-icon'
import InfoIcon from 'part:@sanity/base/info-icon'
import InlineObjectIcon from 'part:@sanity/base/inline-object-icon'
import LaunchIcon from 'part:@sanity/base/launch-icon'
import LightbuldIcon from 'part:@sanity/base/lightbulb-icon'
import LinkIcon from 'part:@sanity/base/link-icon'
import MoreVertIcon from 'part:@sanity/base/more-vert-icon'
import PackageIcon from 'part:@sanity/base/package-icon'
import PasteIcon from 'part:@sanity/base/paste-icon'
import PluginIcon from 'part:@sanity/base/plugin-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import PlusCircleIcon from 'part:@sanity/base/plus-circle-icon'
import PlusCircleOutlineIcon from 'part:@sanity/base/plus-circle-outline-icon'
import PublicIcon from 'part:@sanity/base/public-icon'
import PublishIcon from 'part:@sanity/base/publish-icon'
import QuestionIcon from 'part:@sanity/base/question-icon'
import ResetIcon from 'part:@sanity/base/reset-icon'
import RobotIcon from 'part:@sanity/base/robot-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import SearchIcon from 'part:@sanity/base/search-icon'
import SignOutIcon from 'part:@sanity/base/sign-out-icon'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import SplitHorizontalIcon from 'part:@sanity/base/split-horizontal-icon'
import SortAlphaDescIcon from 'part:@sanity/base/sort-alpha-desc-icon'
import SortIcon from 'part:@sanity/base/sort-icon'
import StackCompactIcon from 'part:@sanity/base/stack-compact-icon'
import StackIcon from 'part:@sanity/base/stack-icon'
import SyncIcon from 'part:@sanity/base/sync-icon'
import ThLargeIcon from 'part:@sanity/base/th-large-icon'
import ThListIcon from 'part:@sanity/base/th-list-icon'
import TimeIcon from 'part:@sanity/base/time-icon'
import TrashIcon from 'part:@sanity/base/trash-icon'
import TrashOutlineIcon from 'part:@sanity/base/trash-outline-icon'
import TruncateIcon from 'part:@sanity/base/truncate-icon'
import UndoIcon from 'part:@sanity/base/undo-icon'
import UnpublishIcon from 'part:@sanity/base/unpublish-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'
import UserIcon from 'part:@sanity/base/user-icon'
import UsersIcon from 'part:@sanity/base/users-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'
import ViewColumnIcon from 'part:@sanity/base/view-column-icon'
import VisibilityIcon from 'part:@sanity/base/visibility-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'

const icons = [
  {title: 'AngleDownIcon', component: AngleDownIcon, partId: 'part:@sanity/base/angle-down-icon'},
  {title: 'AngleUpIcon', component: AngleUpIcon, partId: 'part:@sanity/base/angle-up-icon'},
  {
    title: 'ArrowDropDownIcon',
    component: ArrowDropDownIcon,
    partId: 'part:@sanity/base/arrow-drop-down',
  },
  {
    title: 'ArrowRightIcon',
    component: ArrowRightIcon,
    partId: 'part:@sanity/base/arrow-right',
  },
  {title: 'BarsIcon', component: BarsIcon, partId: 'part:@sanity/base/bars-icon'},
  {title: 'BinaryIcon', component: BinaryIcon, partId: 'part:@sanity/base/binary-icon'},
  {
    title: 'BlockObjectIcon',
    component: BlockObjectIcon,
    partId: 'part:@sanity/base/block-object-icon',
  },
  {title: 'CalendarIcon', component: CalendarIcon, partId: 'part:@sanity/base/calendar-icon'},
  {title: 'CheckIcon', component: CheckIcon, partId: 'part:@sanity/base/check-icon'},
  {
    title: 'ChevronDownIcon',
    component: ChevronDownIcon,
    partId: 'part:@sanity/base/chevron-down-icon',
  },
  {
    title: 'CircleCheckIcon',
    component: CircleCheckIcon,
    partId: 'part:@sanity/base/circle-check-icon',
  },
  {
    title: 'CircleThinIcon',
    component: CircleThinIcon,
    partId: 'part:@sanity/base/circle-thin-icon',
  },
  {
    title: 'ClipboardIcon',
    component: ClipboardIcon,
    partId: 'part:@sanity/base/clipboard-icon',
  },
  {
    title: 'ClipboardImageIcon',
    component: ClipboardImageIcon,
    partId: 'part:@sanity/base/clipboard-image-icon',
  },
  {title: 'CloseIcon', component: CloseIcon, partId: 'part:@sanity/base/close-icon'},
  {title: 'CogIcon', component: CogIcon, partId: 'part:@sanity/base/cog-icon'},
  {title: 'CommentIcon', component: CommentIcon, partId: 'part:@sanity/base/comment-icon'},
  {title: 'ComposeIcon', component: ComposeIcon, partId: 'part:@sanity/base/compose-icon'},
  {
    title: 'ContentCopyIcon',
    component: ContentCopyIcon,
    partId: 'part:@sanity/base/content-copy-icon',
  },
  {title: 'DangerIcon', component: DangerIcon, partId: 'part:@sanity/base/danger-icon'},
  {
    title: 'DragHandleIcon',
    component: DragHandleIcon,
    partId: 'part:@sanity/base/drag-handle-icon',
  },
  {title: 'EditIcon', component: EditIcon, partId: 'part:@sanity/base/edit-icon'},
  {title: 'ErrorIcon', component: ErrorIcon, partId: 'part:@sanity/base/error-icon'},
  {
    title: 'ErrorOutlineIcon',
    component: ErrorOutlineIcon,
    partId: 'part:@sanity/base/error-outline-icon',
  },
  {title: 'EyeIcon', component: EyeIcon, partId: 'part:@sanity/base/eye-icon'},
  {title: 'FileIcon', component: FileIcon, partId: 'part:@sanity/base/file-icon'},
  {title: 'FolderIcon', component: FolderIcon, partId: 'part:@sanity/base/folder-icon'},
  {
    title: 'FormatBoldIcon',
    component: FormatBoldIcon,
    partId: 'part:@sanity/base/format-bold-icon',
  },
  {
    title: 'FormatCodeIcon',
    component: FormatCodeIcon,
    partId: 'part:@sanity/base/format-code-icon',
  },
  {
    title: 'FormatItalicIcon',
    component: FormatItalicIcon,
    partId: 'part:@sanity/base/format-italic-icon',
  },
  {
    title: 'FormatListBulletedIcon',
    component: FormatListBulletedIcon,
    partId: 'part:@sanity/base/format-list-bulleted-icon',
  },
  {
    title: 'FormatListNumberedIcon',
    component: FormatListNumberedIcon,
    partId: 'part:@sanity/base/format-list-numbered-icon',
  },
  {
    title: 'FormatQuoteIcon',
    component: FormatQuoteIcon,
    partId: 'part:@sanity/base/format-quote-icon',
  },
  {
    title: 'FormatStrikethroughIcon',
    component: FormatStrikethroughIcon,
    partId: 'part:@sanity/base/format-strikethrough-icon',
  },
  {
    title: 'FormatUnderlinedIcon',
    component: FormatUnderlinedIcon,
    partId: 'part:@sanity/base/format-underlined-icon',
  },
  {title: 'FullscreenIcon', component: FullscreenIcon, partId: 'part:@sanity/base/fullscreen-icon'},
  {
    title: 'FullscreenExitIcon',
    component: FullscreenExitIcon,
    partId: 'part:@sanity/base/fullscreen-exit-icon',
  },
  {title: 'HamburgerIcon', component: HamburgerIcon, partId: 'part:@sanity/base/hamburger-icon'},
  {title: 'HistoryIcon', component: HistoryIcon, partId: 'part:@sanity/base/history-icon'},
  {title: 'ImageAreaIcon', component: ImageAreaIcon, partId: 'part:@sanity/base/image-area-icon'},
  {title: 'ImageIcon', component: ImageIcon, partId: 'part:@sanity/base/image-icon'},
  {title: 'ImagesIcon', component: ImagesIcon, partId: 'part:@sanity/base/images-icon'},
  {title: 'InfoIcon', component: InfoIcon, partId: 'part:@sanity/base/info-icon'},
  {
    title: 'InlineObjectIcon',
    component: InlineObjectIcon,
    partId: 'part:@sanity/base/inline-object-icon',
  },
  {title: 'LaunchIcon', component: LaunchIcon, partId: 'part:@sanity/base/launch-icon'},
  {title: 'LightbuldIcon', component: LightbuldIcon, partId: 'part:@sanity/base/lightbulb-icon'},
  {title: 'LinkIcon', component: LinkIcon, partId: 'part:@sanity/base/link-icon'},
  {title: 'MoreVertIcon', component: MoreVertIcon, partId: 'part:@sanity/base/more-vert-icon'},
  {title: 'PackageIcon', component: PackageIcon, partId: 'part:@sanity/base/package-icon'},
  {title: 'PasteIcon', component: PasteIcon, partId: 'part:@sanity/base/paste-icon'},
  {title: 'PluginIcon', component: PluginIcon, partId: 'part:@sanity/base/plugin-icon'},
  {title: 'PlusIcon', component: PlusIcon, partId: 'part:@sanity/base/plus-icon'},
  {
    title: 'PlusCircleIcon',
    component: PlusCircleIcon,
    partId: 'part:@sanity/base/plus-circle-icon',
  },
  {
    title: 'PlusCircleOutlineIcon',
    component: PlusCircleOutlineIcon,
    partId: 'part:@sanity/base/plus-circle-outline-icon',
  },
  {title: 'PublicIcon', component: PublicIcon, partId: 'part:@sanity/base/public-icon'},
  {title: 'PublishIcon', component: PublishIcon, partId: 'part:@sanity/base/publish-icon'},
  {title: 'QuestionIcon', component: QuestionIcon, partId: 'part:@sanity/base/question-icon'},
  {title: 'ResetIcon', component: ResetIcon, partId: 'part:@sanity/base/reset-icon'},
  {title: 'RobotIcon', component: RobotIcon, partId: 'part:@sanity/base/robot-icon'},
  {
    title: 'SanityLogoIcon',
    component: SanityLogoIcon,
    partId: 'part:@sanity/base/sanity-logo-icon',
  },
  {title: 'SearchIcon', component: SearchIcon, partId: 'part:@sanity/base/search-icon'},
  {title: 'SignOutIcon', component: SignOutIcon, partId: 'part:@sanity/base/sign-out-icon'},
  {title: 'SpinnerIcon', component: SpinnerIcon, partId: 'part:@sanity/base/spinner-icon'},
  {
    title: 'SplitHorizontalIcon',
    component: SplitHorizontalIcon,
    partId: 'part:@sanity/base/split-horizontal-icon',
  },
  {
    title: 'SortAlphaDescIcon',
    component: SortAlphaDescIcon,
    partId: 'part:@sanity/base/sort-alpha-desc-icon',
  },
  {title: 'SortIcon', component: SortIcon, partId: 'part:@sanity/base/sort-icon'},
  {
    title: 'StackCompactIcon',
    component: StackCompactIcon,
    partId: 'part:@sanity/base/stack-compact-icon',
  },
  {title: 'StackIcon', component: StackIcon, partId: 'part:@sanity/base/stack-icon'},
  {title: 'SyncIcon', component: SyncIcon, partId: 'part:@sanity/base/sync-icon'},
  {title: 'ThLargeIcon', component: ThLargeIcon, partId: 'part:@sanity/base/th-large-icon'},
  {title: 'ThListIcon', component: ThListIcon, partId: 'part:@sanity/base/th-list-icon'},
  {title: 'TimeIcon', component: TimeIcon, partId: 'part:@sanity/base/time-icon'},
  {title: 'TrashIcon', component: TrashIcon, partId: 'part:@sanity/base/trash-icon'},
  {
    title: 'TrashOutlineIcon',
    component: TrashOutlineIcon,
    partId: 'part:@sanity/base/trash-outline-icon',
  },
  {title: 'TruncateIcon', component: TruncateIcon, partId: 'part:@sanity/base/truncate-icon'},
  {title: 'UndoIcon', component: UndoIcon, partId: 'part:@sanity/base/undo-icon'},
  {title: 'UnpublishIcon', component: UnpublishIcon, partId: 'part:@sanity/base/unpublish-icon'},
  {title: 'UploadIcon', component: UploadIcon, partId: 'part:@sanity/base/upload-icon'},
  {title: 'UserIcon', component: UserIcon, partId: 'part:@sanity/base/user-icon'},
  {title: 'UsersIcon', component: UsersIcon, partId: 'part:@sanity/base/users-icon'},
  {
    title: 'VisibilityOffIcon',
    component: VisibilityOffIcon,
    partId: 'part:@sanity/base/visibility-off-icon',
  },
  {
    title: 'ViewColumnIcon',
    component: ViewColumnIcon,
    partId: 'part:@sanity/base/view-column-icon',
  },
  {title: 'VisibilityIcon', component: VisibilityIcon, partId: 'part:@sanity/base/visibility-icon'},
  {title: 'WarningIcon', component: WarningIcon, partId: 'part:@sanity/base/warning-icon'},
]

function IconRow({component, partId, title}) {
  if (!component) {
    return <li>Missing `component` for {partId}</li>
  }

  return (
    <li className={styles.icon}>
      <div className={styles.iconPreview}>{React.createElement(component)}</div>
      <div className={styles.iconText}>
        <div className={styles.iconTitle}>{title}</div>
        <pre className={styles.iconCode}>{`import ${component.name} from '${partId}'`}</pre>
      </div>
    </li>
  )
}

export function IconsStory() {
  return (
    <Container>
      <h1 className={styles.headline}>Icons</h1>
      <ul className={styles.list}>
        {icons.map((icon) => (
          <IconRow key={icon.partId} {...icon} />
        ))}
      </ul>
    </Container>
  )
}
