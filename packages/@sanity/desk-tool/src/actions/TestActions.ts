import * as React from 'react'
import {createAction} from 'part:@sanity/base/actions/utils'

export const FOO = createAction(() => {
  const [isDisabled, setDisabled] = React.useState(true)
  const [counter, setCounter] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => {
      setDisabled(() => !isDisabled)
      setCounter(p => p + 1)
    }, 2000)
    return () => {
      clearInterval(id)
    }
  }, [])

  return {
    label: `Hel!lo ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
    disabled: isDisabled
  }
})
export const BAR = createAction(() => ({
  label: 'Hello2',
  disabled: true
}))
export const BAZ = createAction(() => ({
  label: 'Hello [enabled]',
  disabled: false
}))

export const QUX = createAction(() => {
  const [isDisabled, setDisabled] = React.useState(false)
  const [counter, setCounter] = React.useState(0)
  React.useEffect(() => {
    const id = setInterval(() => {
      setDisabled(() => !isDisabled)
      setCounter(prev => prev + 1)
    }, 2000)
    return () => {
      clearInterval(id)
    }
  }, [])

  return {
    label: `Hell2o ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
    disabled: isDisabled
  }
})
