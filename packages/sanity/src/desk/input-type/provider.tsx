import React, {useCallback, useEffect, useState} from 'react'
import {InputTypeContext} from './context'
import {InputType} from './types'

interface InputTypeProviderProps {
  children: React.ReactNode
}

export function InputTypeProvider(props: InputTypeProviderProps) {
  const {children} = props
  const [inputType, setInputType] = useState<InputType>('initial')

  const handlePointerDown = useCallback(() => setInputType('mouse'), [])
  const handleKeyDown = useCallback(() => setInputType('keyboard'), [])
  const handleTouchStart = useCallback(() => setInputType('touch'), [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('touchstart', handleTouchStart)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [handleKeyDown, handlePointerDown, handleTouchStart])

  return <InputTypeContext.Provider value={inputType}>{children}</InputTypeContext.Provider>
}
