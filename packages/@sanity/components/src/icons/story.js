import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'

// import * as FontAwesome from 'react-icons/lib/fa'
// import * as MaterialDesignIcons from 'react-icons/lib/md'
// import * as Typicons from 'react-icons/lib/ti'
// import * as GithubOcticons from 'react-icons/lib/go'
// import * as Ionicons from 'react-icons/lib/io'

// import {keysIn} from 'lodash'
import styles from './styles/iconStory.css'

// Sanity icons
import CloseIcon from 'part:@sanity/base/close-icon'
import AngleDownIcon from 'part:@sanity/base/angle-down-icon'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import HamburgerIcon from 'part:@sanity/base/hamburger-icon'
import UploadIcon from 'part:@sanity/base/upload-icon'
import FormatBoldIcon from 'part:@sanity/base/format-bold-icon'
import FormatItalicIcon from 'part:@sanity/base/format-italic-icon'
import FormatListBulletedIcon from 'part:@sanity/base/format-list-bulleted-icon'
import FormatListNumberedIcon from 'part:@sanity/base/format-list-numbered-icon'
import FormatQuoteIcon from 'part:@sanity/base/format-quote-icon'
import FormatStrikethroughIcon from 'part:@sanity/base/format-strikethrough-icon'
import FormatUnderlinedIcon from 'part:@sanity/base/format-underlined-icon'
import FullscreenIcon from 'part:@sanity/base/fullscreen-icon'
import FullscreenExitIcon from 'part:@sanity/base/fullscreen-exit-icon'
import PlusIcon from 'part:@sanity/base/plus-icon'
import ArrowDropDownIcon from 'part:@sanity/base/arrow-drop-down'
import TrashIcon from 'part:@sanity/base/trash-icon'

function createIconPreview(title, Icon, role) {
  return (
    <li className={styles.sanityIcon}>
      <div className={styles.title}>{title}</div>
      <div className={styles.role}>
        import {Icon.name} from &lsquo;{role}&lsquo;
      </div>
      <span className={styles.iconPreviewXL}><Icon /></span>
      <span className={styles.iconPreviewL}><Icon /></span>
      <span className={styles.iconPreviewM}><Icon /></span>
      <span className={styles.iconPreviewS}><Icon /></span>
      <span className={styles.iconPreviewXS}><Icon /></span>
    </li>
  )
}

storiesOf('Icons')
.add(
  'Used icons',
  () => {
    return (
      <ul className={styles.sanityIcons}>
        {createIconPreview('Sanity logo', SanityLogoIcon, 'part:@sanity/base/sanity-logo-icon')}
        {createIconPreview('Close', CloseIcon, 'part:@sanity/base/close-icon')}
        {createIconPreview('Angle Down', AngleDownIcon, 'part:@sanity/base/angle-down-icon')}
        {createIconPreview('Spinner', SpinnerIcon, 'part:@sanity/base/spinner-icon')}
        {createIconPreview('Hamburger', HamburgerIcon, 'part:@sanity/base/hamburger-icon')}

        {createIconPreview('Upload', UploadIcon, 'part:@sanity/base/upload-icon')}
        {createIconPreview('Format bold', FormatBoldIcon, 'part:@sanity/base/format-bold-icon')}
        {createIconPreview('Format italic', FormatItalicIcon, 'part:@sanity/base/format-italic-icon')}
        {createIconPreview('Format List (bulleted)', FormatListBulletedIcon, 'part:@sanity/base/format-list-bulleted-icon')}
        {createIconPreview('Format List (numbered)', FormatListNumberedIcon, 'part:@sanity/base/format-list-numbered-icon')}
        {createIconPreview('Format quote', FormatQuoteIcon, 'part:@sanity/base/format-quote-icon')}
        {createIconPreview('Format strikethrough', FormatStrikethroughIcon, 'part:@sanity/base/format-strikethrough-icon')}
        {createIconPreview('Format underlined', FormatUnderlinedIcon, 'part:@sanity/base/format-underlined-icon')}
        {createIconPreview('Fullscreen', FullscreenIcon, 'part:@sanity/base/fullscreen-icon')}
        {createIconPreview('Fullscreen exit', FullscreenExitIcon, 'part:@sanity/base/fullscreen-exit-icon')}
        {createIconPreview('Plus', PlusIcon, 'part:@sanity/base/plus-icon')}
        {createIconPreview('Arrow Drop Down', ArrowDropDownIcon, 'part:@sanity/base/arrow-drop-down')}
        {createIconPreview('Trash', TrashIcon, 'part:@sanity/base/trash-icon')}

      </ul>
    )
  },
  {inline: false}
)
