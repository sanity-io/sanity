import React from 'react'

import {mutate} from '../mockDocStateDatastore'
import {set} from './patch-helpers'

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function doSomeWork(id) {
  await wait(1000)
  mutate(id, [set('randomNumber', Math.random())])
}

export default function AsyncAction(docInfo) {
  const [isWorking, setIsWorking] = React.useState(false)

  return {
    disabled: isWorking,
    showActivityIndicator: isWorking,
    label: isWorking ? 'Working…' : 'Do some work!',
    handle: async () => {
      setIsWorking(true)
      await doSomeWork(docInfo.id)
      setIsWorking(false)
    }
  }
}
