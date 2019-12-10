import React from 'react'

import {mutate} from '../mockDocStateDatastore'
import {set} from './patch-helpers'
import {useDocumentOperation} from '@sanity/react-hooks'
import {createAction} from './createAction'

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function doSomeWork(id) {
  await wait(1000)
  return Math.random()
}

export default createAction(function AsyncAction(docInfo) {
  const [isWorking, setIsWorking] = React.useState(false)

  const {patch} = useDocumentOperation(docInfo.id, docInfo.type)

  return {
    disabled: isWorking,
    showActivityIndicator: isWorking,
    label: isWorking ? 'Working…' : 'Do some work!',
    handle: async () => {
      setIsWorking(true)
      const result = await doSomeWork(docInfo.id)
      patch([set('randomNumber', result)])
      setIsWorking(false)
    }
  }
})
