import React from 'react'
import {storiesOf} from 'part:@sanity/storybook'
import {withKnobs, color} from 'part:@sanity/storybook/addons/knobs'
import Sanity from 'part:@sanity/storybook/addons/sanity'
import styles from './styles/iconStory.css'

// Sanity icons
import CloseIcon from 'part:@sanity/base/close-icon'
import AngleDownIcon from 'part:@sanity/base/angle-down-icon'
import SpinnerIcon from 'part:@sanity/base/spinner-icon'
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
import UndoIcon from 'part:@sanity/base/undo-icon'
import VisibilityOffIcon from 'part:@sanity/base/visibility-off-icon'

// Logos
import SanityLogo from 'part:@sanity/base/sanity-logo'
import SanityLogoAlpha from 'part:@sanity/base/sanity-logo-alpha'
import SanityLogoIcon from 'part:@sanity/base/sanity-logo-icon'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import BrandLogo from 'part:@sanity/base/brand-logo?'

function createIconPreview(title, Icon, role) {
  return (
    <li className={styles.sanityIcon}>
      <div className={styles.title}>{title}</div>
      <div className={styles.role}>
        import {Icon.name} from &lsquo;{role}&lsquo;
      </div>
      <span className={styles.iconPreviewXL}>
        <Icon />
      </span>
      <span className={styles.iconPreviewL}>
        <Icon />
      </span>
      <span className={styles.iconPreviewM}>
        <Icon />
      </span>
      <span className={styles.iconPreviewS}>
        <Icon />
      </span>
      <span className={styles.iconPreviewXS}>
        <Icon />
      </span>
    </li>
  )
}

storiesOf('Icons')
  .addDecorator(withKnobs)
  .add(
    'Icons',
    () => {
      return (
        <ul
          className={styles.sanityIcons}
          style={{
            color: color('color', undefined),
            backgroundColor: color('background', undefined)
          }}
        >
          {createIconPreview('Sanity logo', SanityLogoIcon, 'part:@sanity/base/sanity-logo-icon')}
          {createIconPreview('Close', CloseIcon, 'part:@sanity/base/close-icon')}
          {createIconPreview('Angle Down', AngleDownIcon, 'part:@sanity/base/angle-down-icon')}
          {createIconPreview('Spinner', SpinnerIcon, 'part:@sanity/base/spinner-icon')}
          {createIconPreview('Hamburger', HamburgerIcon, 'part:@sanity/base/hamburger-icon')}

          {createIconPreview('Upload', UploadIcon, 'part:@sanity/base/upload-icon')}
          {createIconPreview('Format bold', FormatBoldIcon, 'part:@sanity/base/format-bold-icon')}
          {createIconPreview(
            'Format italic',
            FormatItalicIcon,
            'part:@sanity/base/format-italic-icon'
          )}
          {createIconPreview(
            'Format List (bulleted)',
            FormatListBulletedIcon,
            'part:@sanity/base/format-list-bulleted-icon'
          )}
          {createIconPreview(
            'Format List (numbered)',
            FormatListNumberedIcon,
            'part:@sanity/base/format-list-numbered-icon'
          )}
          {createIconPreview(
            'Format quote',
            FormatQuoteIcon,
            'part:@sanity/base/format-quote-icon'
          )}
          {createIconPreview(
            'Format strikethrough',
            FormatStrikethroughIcon,
            'part:@sanity/base/format-strikethrough-icon'
          )}
          {createIconPreview(
            'Format underlined',
            FormatUnderlinedIcon,
            'part:@sanity/base/format-underlined-icon'
          )}
          {createIconPreview('Fullscreen', FullscreenIcon, 'part:@sanity/base/fullscreen-icon')}
          {createIconPreview(
            'Fullscreen exit',
            FullscreenExitIcon,
            'part:@sanity/base/fullscreen-exit-icon'
          )}
          {createIconPreview('Plus', PlusIcon, 'part:@sanity/base/plus-icon')}
          {createIconPreview(
            'Arrow Drop Down',
            ArrowDropDownIcon,
            'part:@sanity/base/arrow-drop-down'
          )}
          {createIconPreview('Trash', TrashIcon, 'part:@sanity/base/trash-icon')}
          {createIconPreview('Undo', UndoIcon, 'part:@sanity/base/undo-icon')}
          {createIconPreview(
            'Visibility off',
            VisibilityOffIcon,
            'part:@sanity/base/visibility-off-icon'
          )}
        </ul>
      )
    },
    {inline: false}
  )

storiesOf('Logos')
  .addDecorator(withKnobs)
  .add('Sanity', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-logo" propTables={[SanityLogo]}>
            <SanityLogo />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Icon', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-logo-icon" propTables={[SanityLogoIcon]}>
            <SanityLogoIcon />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Alpha', () => {
    return (
      <Sanity part="part:@sanity/base/sanity-logo-alpha" propTables={[SanityLogoAlpha]}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            color: color('color', '#fff'),
            backgroundColor: color('background', '#f43')
          }}
        >
          <div
            style={{
              position: 'absolute',
              height: '50vh',
              width: '50vw',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <SanityLogoAlpha />
          </div>
        </div>
      </Sanity>
    )
  })

  .add('Brand', () => {
    if (!BrandLogo) {
      return (
        <div>
          No brand logo. Implement <code>part:@sanity/base/brand-logo</code>
        </div>
      )
    }
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/brand-logo" propTables={[BrandLogo]}>
            <BrandLogo />
          </Sanity>
        </div>
      </div>
    )
  })
  .add('Sanity Studio', () => {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          color: color('color', '#fff'),
          backgroundColor: color('background', '#f43')
        }}
      >
        <div
          style={{
            position: 'absolute',
            height: '50vh',
            width: '50vw',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Sanity part="part:@sanity/base/sanity-studio-logo" propTables={[SanityStudioLogo]}>
            <SanityStudioLogo />
          </Sanity>
        </div>
      </div>
    )
  })
