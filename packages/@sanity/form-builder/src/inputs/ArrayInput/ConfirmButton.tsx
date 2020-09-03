import React, {useCallback, useEffect, useRef, useState} from 'react'
import Button from 'part:@sanity/components/buttons/default'
import {MenuButton} from 'part:@sanity/components/menu-button'
import TrashIcon from 'part:@sanity/base/trash-icon'

import styles from './styles/ConfirmButton.css'

// @todo
type DefaultButtonInstance = any
type DefaultButtonProps = Record<string, any>

export default function ConfirmButton(props: {onConfirm: () => void} & DefaultButtonProps) {
  const {onConfirm, ...restProps} = props
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<DefaultButtonInstance>(null)

  useEffect(() => {
    if (open && buttonRef.current) buttonRef.current.focus()
  }, [open])

  const handleBlur = useCallback(() => setOpen(false), [])

  return (
    <MenuButton
      buttonProps={{
        ...restProps,
        icon: TrashIcon,
        padding: 'small'
      }}
      menu={
        <div className={styles.wrapper}>
          <Button
            color="danger"
            onClick={onConfirm}
            kind="simple"
            padding="small"
            onBlur={handleBlur}
            ref={buttonRef}
          >
            Confirm delete
          </Button>
        </div>
      }
      open={open}
      placement="left"
      setOpen={setOpen}
    />
  )
}
