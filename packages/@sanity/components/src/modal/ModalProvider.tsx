import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useModal} from './hooks'
import {ModalContext} from './ModalContext'

export function ModalProvider({children}: {children: React.ReactNode}) {
  const parentModal = useModal()

  const [size, setSize] = useState(0)

  const mount = useCallback(() => {
    setSize(val => val + 1)
    return () => setSize(val => val - 1)
  }, [])

  const modal = useMemo(() => {
    const depth = parentModal ? parentModal.depth + 1 : 1

    return {
      depth,
      mount: parentModal?.mount || mount,
      size: parentModal?.size || size
    }
  }, [mount, parentModal, size])

  const _mount = modal.mount

  useEffect(() => _mount(), [_mount])

  return <ModalContext.Provider value={modal}>{children}</ModalContext.Provider>
}
