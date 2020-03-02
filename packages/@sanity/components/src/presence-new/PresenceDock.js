import React from 'react'
import cx from 'classnames'
import {isEqual} from 'lodash'
import styles from './styles/PresenceDock.css'
import Avatar from './Avatar'

// type Props = {
//   children: React.ReactNode
// }

const regex = /(auto|scroll)/

const style = (node, prop) => getComputedStyle(node, null).getPropertyValue(prop)

const scroll = node =>
  regex.test(style(node, 'overflow') + style(node, 'overflow-y') + style(node, 'overflow-x'))

const scrollparent = node =>
  !node || node === document.body
    ? document.body
    : scroll(node)
    ? node
    : scrollparent(node.parentNode)

export default function PresenceDock({children, presence}) {
  const [topUsers, setTopUsers] = React.useState([])
  const [bottomUsers, setBottomUsers] = React.useState([])

  const rootRef = React.useRef(null)
  const topRef = React.useRef(null)
  const bottomRef = React.useRef(null)

  function scrollToField(event) {
    const position = event.currentTarget.getAttribute('data-dock')
    if (position === 'top') {
      event.currentTarget.scrollIntoView({behavior: 'smooth', block: 'end'})
    } else {
      event.currentTarget.scrollIntoView({behavior: 'smooth'})
    }
  }

  function handleTopBottomUsers(scrollContainer, presenceContainers) {
    const topElm = topRef && topRef.current
    const bottomElm = bottomRef && bottomRef.current
    let _topUsers = []
    let _bottomUsers = []
    const topElmtopY = topElm.getBoundingClientRect().y
    presenceContainers.forEach(elm => {
      const userIds = elm
        .getAttribute('data-presence-container')
        .split(',')
        .filter(id => !!id)
      if (userIds.length > 0) {
        const elmtopY = elm.getBoundingClientRect().y
        if (elm.offsetTop < scrollContainer.offsetHeight / 2 && elmtopY < topElmtopY) {
          _topUsers = _topUsers.concat(userIds)
          elm.setAttribute('data-hidden', 'top')
        } else if (
          elm.offsetTop > scrollContainer.offsetHeight / 2 &&
          elm.offsetTop > bottomElm.offsetTop
        ) {
          elm.setAttribute('data-hidden', 'bottom')
          _bottomUsers = _bottomUsers.concat(userIds)
        } else {
          elm.removeAttribute('data-hidden')
        }
      }
    })
    setTopUsers(
      _topUsers.map(id => ({
        id,
        position: 'top'
      }))
    )
    setBottomUsers(
      _bottomUsers.map(id => ({
        id,
        position: 'bottom'
      }))
    )
  }

  React.useEffect(() => {
    const rootElm = rootRef && rootRef.current
    const scrollContainer = scrollparent(rootElm)
    const presenceContainers = rootElm.querySelectorAll('[data-presence-container]')
    scrollContainer.addEventListener('scroll', event => {
      handleTopBottomUsers(scrollContainer, presenceContainers)
    })
  }, [])

  React.useEffect(() => {
    const rootElm = rootRef && rootRef.current
    const scrollContainer = scrollparent(rootElm)
    const presenceContainers = rootElm.querySelectorAll('[data-presence-container]')
    handleTopBottomUsers(scrollContainer, presenceContainers)
  }, [presence])

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={cx(styles.dock, styles.top)} ref={topRef}>
        {topUsers.map(user => (
          <Avatar
            key={user.id}
            id={user.id}
            position={user.position}
            scrollToField={scrollToField}
          />
        ))}
      </div>
      {children}
      <div className={cx(styles.dock, styles.bottom)} ref={bottomRef}>
        {bottomUsers.map(user => (
          <Avatar
            key={user.id}
            id={user.id}
            position={user.position}
            scrollToField={scrollToField}
          />
        ))}
      </div>
    </div>
  )
}
