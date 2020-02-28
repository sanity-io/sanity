import React from 'react'
import cx from 'classnames'
import styles from './styles/PresenceDock.css'
import Avatar from './Avatar'
import {uniq} from 'lodash'

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

export default function PresenceDock({children}) {
  const [topDockUsers, setTopDockUsers] = React.useState([])
  const [bottomDockUsers, setBottomDockUsers] = React.useState([])

  const interSectionCallback = entries => {
    let _topDockUsers = []
    let _bottomDockUsers = []
    entries.forEach(entry => {
      const userIds = entry.target
        .getAttribute('data-presence-container')
        .split(',')
        .filter(id => !!id)
      if (userIds.length === 0) {
        setTopDockUsers([])
        setBottomDockUsers([])
        return
      }
      let dockPosition = 'top'
      if (entry.intersectionRect.y >= entry.rootBounds.bottom / 2) {
        dockPosition = 'bottom'
      }
      const visible = entry.isIntersecting
      if (!visible && dockPosition === 'top') {
        _topDockUsers = _topDockUsers.concat(userIds)
      }
      if (!visible && dockPosition === 'bottom') {
        _bottomDockUsers = _bottomDockUsers.concat(userIds)
      }
    })
    setTopDockUsers(uniq(_topDockUsers))
    setBottomDockUsers(uniq(_bottomDockUsers))
  }
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    const rootElm = rootRef && rootRef.current
    if (rootElm) {
      const scrollContainer = scrollparent(rootElm)
      const options = {
        root: scrollContainer,
        rootMargin: '0px',
        threshold: 1.0
      }
      const observer = new IntersectionObserver(interSectionCallback, options)
      const presenceContainers = rootElm.querySelectorAll('[data-presence-container]')
      presenceContainers.forEach(elm => {
        observer.observe(elm)
      })
    }
  }, [])
  return (
    <div className={styles.root} ref={rootRef}>
      <div className={cx(styles.dock, styles.top)}>
        {topDockUsers.map(identity => (
          <Avatar key={identity} id={identity} />
        ))}
      </div>
      {children}
      <div className={cx(styles.dock, styles.bottom)}>
        {bottomDockUsers.map(identity => (
          <Avatar key={identity} id={identity} />
        ))}
      </div>
    </div>
  )
}
