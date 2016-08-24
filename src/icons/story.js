import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'

// import * as FontAwesome from 'react-icons/lib/fa'
// import * as MaterialDesignIcons from 'react-icons/lib/md'
// import * as Typicons from 'react-icons/lib/ti'
// import * as GithubOcticons from 'react-icons/lib/go'
// import * as Ionicons from 'react-icons/lib/io'

// import {keysIn} from 'lodash'
import styles from './styles/iconStory.css'

// Sanity icons
import CloseIcon from 'icon:@sanity/close'
import AngleDownIcon from 'icon:@sanity/angle-down'
import SpinnerIcon from 'icon:@sanity/spinner'
import SanityLogoIcon from 'icon:@sanity/sanity-logo'

function createIconPreview(title, Icon, role) {
  return (
    <li className={styles.sanityIcon}>
      <div className={styles.title}>{title}</div>
      <div className={styles.role}>import {Icon.name} from '{role}'</div>
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
        {createIconPreview('Sanity logo', SanityLogoIcon, 'icon:@sanity/sanity-logo')}
        {createIconPreview('Close', CloseIcon, 'icon:@sanity/close')}
        {createIconPreview('Angle Down', AngleDownIcon, 'icon:@sanity/angle-down')}
        {createIconPreview('Spinner', SpinnerIcon, 'icon:@sanity/spinner')}
      </ul>
    )
  },
  {inline: false}
)

/*
.add(
  'Font awesome',
  () => {


    const FaKeys = keysIn(FontAwesome)

    return (
      <ul className={styles.list}>
        {
          FaKeys.map(key => {
            const Icon = FontAwesome[key]
            return (
              <li key={key} className={styles.item}>
                <div className={styles.icon}>
                  <Icon />
                </div>
                <div className={styles.iconName}>
                  {key}
                </div>
              </li>
            )
          })
        }
      </ul>
    )
  },
  {inline: false}
)
.add(
  'Material Design Icons',
  () => {


    const MdKeys = keysIn(MaterialDesignIcons)

    return (
      <ul className={styles.list}>
        {
          MdKeys.map(key => {
            const Icon = MaterialDesignIcons[key]
            return (
              <li key={key} className={styles.item}>
                <div className={styles.icon}>
                  <Icon />
                </div>
                <div className={styles.iconName}>
                  {key}
                </div>
              </li>
            )
          })
        }
      </ul>
    )
  }
)

.add(
  'Typicons',
  () => {


    const TiKeys = keysIn(Typicons)

    return (
      <ul className={styles.list}>
        {
          TiKeys.map(key => {
            const Icon = Typicons[key]
            return (
              <li key={key} className={styles.item}>
                <div className={styles.icon}>
                  <Icon />
                </div>
                <div className={styles.iconName}>
                  {key}
                </div>
              </li>
            )
          })
        }
      </ul>
    )
  },
  {inline: false}
)


.add(
  'Github Octicons',
  () => {


    const GoKeys = keysIn(GithubOcticons)

    return (
      <ul className={styles.list}>
        {
          GoKeys.map(key => {
            const Icon = GithubOcticons[key]
            return (
              <li key={key} className={styles.item}>
                <div className={styles.icon}>
                  <Icon />
                </div>
                <div className={styles.iconName}>
                  {key}
                </div>
              </li>
            )
          })
        }
      </ul>
    )
  }
)
.add(
  'Ionicons',
  () => {


    const IoKeys = keysIn(Ionicons)

    return (
      <ul className={styles.list}>
        {
          IoKeys.map(key => {
            const Icon = Ionicons[key]
            return (
              <li key={key} className={styles.item}>
                <div className={styles.icon}>
                  <Icon />
                </div>
                <div className={styles.iconName}>
                  {key}
                </div>
              </li>
            )
          })
        }
      </ul>
    )
  }
)
*/
