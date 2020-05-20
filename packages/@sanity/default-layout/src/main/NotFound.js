import React from 'react'
import {withRouterHOC, StateLink} from 'part:@sanity/base/router'
import {HAS_SPACES} from '../util/spaces'

import styles from './NotFound.css'

export default withRouterHOC(function NotFound(props) {
  const router = props.router
  const rootState = HAS_SPACES && router.state.space ? {space: router.state.space} : {}

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h2>Page not found</h2>
      </header>

      <div className={styles.content}>{props.children}</div>

      <div className={styles.footer}>
        <StateLink state={rootState}>Go to index</StateLink>
      </div>
    </div>
  )
})
