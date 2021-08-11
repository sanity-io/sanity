// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import {withRouterHOC, StateLink} from 'part:@sanity/base/router'
import {HAS_SPACES} from '../util/spaces'
import {Router} from '../types'

import styles from './NotFound.css'

interface OuterProps {
  children: React.ReactNode
}

interface NotFoundProps {
  children: React.ReactNode
  router: Router
}

function NotFound(props: NotFoundProps) {
  const router = props.router
  const rootState =
    HAS_SPACES && router.state && router.state.space ? {space: router.state.space} : {}

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
}

export default (withRouterHOC(NotFound) as any) as React.ComponentType<OuterProps>
