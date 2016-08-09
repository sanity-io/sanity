import React from 'react'
import {storiesOf} from 'component:@sanity/storybook'

import * as FontAwesome from 'react-icons/lib/fa'
import * as MaterialDesignIcons from 'react-icons/lib/md'
import * as Typicons from 'react-icons/lib/ti'
import * as GithubOcticons from 'react-icons/lib/go'
import * as Ionicons from 'react-icons/lib/io'

import {keysIn} from 'lodash'
import styles from './styles/iconStory.css'

storiesOf('Icons').add(
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
