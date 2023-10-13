import React from 'react'
import {CommentsSetupProvider} from '../../src'
import {LayoutProps} from 'sanity'

export function CommentsLayout(props: LayoutProps) {
  return <CommentsSetupProvider>{props.renderDefault(props)}</CommentsSetupProvider>
}
