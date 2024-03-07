/* eslint-disable import/no-extraneous-dependencies */

import {PublishIcon} from '@sanity/icons'
import {useCallback} from 'react'
import {type DocumentActionComponent, useBufferedDataset, useClient} from 'sanity'

/** @internal */
export const CommitAction: DocumentActionComponent = ({id, type, draft, onComplete}) => {
  const dataset = useBufferedDataset(useClient({apiVersion: 'v2024-04-07'}))

  const handle = useCallback(() => {
    dataset.submit()
  }, [dataset])

  return {
    tone: 'positive',
    icon: PublishIcon,
    shortcut: 'CMD+S',
    onHandle: handle,
    label: 'Commit changes',
  }
}

CommitAction.action = 'delete'
