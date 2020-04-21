/* eslint-disable @typescript-eslint/explicit-function-return-type */

import * as React from 'react'

export const FOO = () => {
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
}

export const BAR = () => ({
  label: 'Hello2',
  disabled: true
})

export const BAZ = () => ({
  label: 'Hello [enabled]',
  disabled: false
})

export const QUX = () => {
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
}
