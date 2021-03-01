import {useEffect, useState} from 'react'

export const FOO = () => {
  const [isDisabled, setDisabled] = useState(true)
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setDisabled((val) => !val)
      setCounter((p) => p + 1)
    }, 2000)

    return () => clearInterval(id)
  }, [])

  return {
    label: `Hel!lo ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
    disabled: isDisabled,
  }
}

export const BAR = () => ({
  label: 'Hello2',
  disabled: true,
})

export const BAZ = () => ({
  label: 'Hello [enabled]',
  disabled: false,
})

export const QUX = () => {
  const [isDisabled, setDisabled] = useState(false)
  const [counter, setCounter] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setDisabled((val) => !val)
      setCounter((prev) => prev + 1)
    }, 2000)

    return () => {
      clearInterval(id)
    }
  }, [])

  return {
    label: `Hello ${counter} [${isDisabled ? 'disabled' : 'enabled'}]`,
    disabled: isDisabled,
  }
}
