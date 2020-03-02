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
  const [watchedUsers, setWatchedUsers] = React.useState(
    presence.map(item => ({id: item.identity, position: 'top', visible: true, path: item.path}))
  )

  const interSectionCallback = entries => {
    entries.forEach(entry => {
      const userIds = entry.target
        .getAttribute('data-presence-container')
        .split(',')
        .filter(id => !!id)
      let dockPosition = 'top'
      if (entry.intersectionRect.y > entry.rootBounds.bottom / 2) {
        dockPosition = 'bottom'
      }
      const visible = entry.isIntersecting
      visible
        ? entry.target.removeAttribute('data-hidden')
        : entry.target.setAttribute('data-hidden', dockPosition)

      userIds.map(id => {
        const user = watchedUsers.find(usr => usr.id === id)
        if (user) {
          user.visible = visible
          user.position = dockPosition
          setWatchedUsers(watchedUsers.filter(usr => usr.id !== user.id).concat(user))
        } else {
          setWatchedUsers(
            watchedUsers.concat({
              id,
              position: dockPosition,
              visible: visible
            })
          )
        }
      })
    })
  }
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    const rootElm = rootRef && rootRef.current
    if (rootElm) {
      const scrollContainer = scrollparent(rootElm)
      const options = {
        root: scrollContainer,
        rootMargin: '-10px 0px 0px 0px',
        threshold: 1.0
      }
      const observer = new IntersectionObserver(interSectionCallback, options)
      const presenceContainers = rootElm.querySelectorAll('[data-presence-container]')
      presenceContainers.forEach(elm => {
        observer.observe(elm)
      })
    }
  }, [])

  React.useEffect(() => {
    // Ensure we only got the ones that are supposed to be here
    setWatchedUsers(
      watchedUsers
        .filter(usr => presence.map(item => item.identity).includes(usr.id))
        .map(usr => {
          const presenceUsr = presence.find(item => item.identity === usr.id)
          if (presenceUsr && !isEqual(presenceUsr.path, usr.path)) {
            usr.visible = true
            usr.path = presenceUsr.path
          }
          return usr
        })
    )
  }, [presence])

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={cx(styles.dock, styles.top)}>
        {watchedUsers
          .filter(user => user.position === 'top' && !user.visible)
          .map(user => (
            <Avatar key={user.id} id={user.id} position={user.position} />
          ))}
      </div>
      {children}
      <div className={cx(styles.dock, styles.bottom)}>
        {watchedUsers
          .filter(user => user.position === 'bottom' && !user.visible)
          .map(user => (
            <Avatar key={user.id} id={user.id} position={user.position} />
          ))}
      </div>
    </div>
  )
}
