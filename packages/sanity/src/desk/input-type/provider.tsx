import React, {useEffect, useState} from 'react'
import {InputTypeContext} from './context'
import {InputType} from './types'

interface InputTypeProviderProps {
  children: React.ReactNode
}

export function InputTypeProvider(props: InputTypeProviderProps) {
  const {children} = props

  const [inputType, setInputType] = useState<InputType>('initial')

  useEffect(() => {
    const handlePointerDown = () => setInputType('mouse')
    const handleKeyDown = () => setInputType('keyboard')
    const handleTouchStart = () => setInputType('touch')

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('pointerdown', handlePointerDown, true)
    document.addEventListener('touchstart', handleTouchStart, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      document.removeEventListener('touchstart', handleTouchStart, true)
    }
  }, [])

  return <InputTypeContext.Provider value={inputType}>{children}</InputTypeContext.Provider>
}
