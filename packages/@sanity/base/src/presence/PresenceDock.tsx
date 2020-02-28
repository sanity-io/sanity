import React from 'react'
import cx from 'classnames'
import styles from './styles/PresenceDock.css'
import Avatar from './Avatar'

type Props = {
  children: React.ReactNode
}

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

export default function PresenceDock({children}: Props): HTMLDivElement {
  const avatarsTop = [
    {
      dock: 'top',
      id: 'avatar1'
    },
    {
      status: 'syncing',
      dock: 'top',
      id: 'avatar2',
      initials: 'PK',
      color: 'blue'
    },
    {
      status: 'inactive',
      dock: 'top',
      id: 'avatar3',
      initials: 'BB',
      color: 'blue'
    }
  ]
  const avatarsBottom = [
    {
      status: 'active',
      dock: 'bottom',
      id: 'avatar1',
      initials: 'VB',
      color: 'blue'
    },
    {
      status: 'syncing',
      dock: 'bottom',
      id: 'avatar2',
      initials: 'PK',
      color: 'blue'
    },
    {
      status: 'inactive',
      dock: 'bottom',
      id: 'avatar3',
      initials: 'BB',
      color: 'blue'
    }
  ]

  const callback = entries => {
    entries.forEach(entry => {
      const label = entry.target.getAttribute('data-presence-container').split(',')
      let dockPosition = 'above'
      if (entry.intersectionRect.y > entry.rootBounds.bottom / 2) {
        dockPosition = 'below'
      }
      console.log(label, `visible: ${entry.isIntersecting} - dockPosition: ${dockPosition}`)
      // console.log('users', entry.target.getAttribute('data-presence-users'))
    })
  }
  const rootRef = React.useRef(null)

  React.useEffect(() => {
    const rootElm: any = rootRef && rootRef.current
    if (rootElm) {
      const scrollContainer = scrollparent(rootElm)
      const options = {
        root: scrollContainer,
        rootMargin: '0px',
        threshold: 1.0
      }
      const observer = new IntersectionObserver(callback, options)
      const presenceContainers = rootElm.querySelectorAll('[data-presence-container]')
      presenceContainers.forEach(elm => {
        observer.observe(elm)
      })
      console.log(`Observing ${presenceContainers.length} presence containers`)
    }
  }, [])

  return (
    <div className={styles.root} ref={rootRef}>
      <div className={cx(styles.dock, styles.top)}>
        {/* {avatarsTop.map(a => (
          <Avatar key={a.id} {...a} />
        ))} */}
      </div>
      {children}
      <div className={cx(styles.dock, styles.bottom)}>
        {/* {avatarsBottom.map(a => (
          <Avatar key={a.id} {...a} />
        ))} */}
      </div>
    </div>
  )
}
