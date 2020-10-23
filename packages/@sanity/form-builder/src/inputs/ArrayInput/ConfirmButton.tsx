import {Placement} from '@sanity/components'
import React, {useCallback, useEffect, useRef, useState} from 'react'
import Button from 'part:@sanity/components/buttons/default'
import {MenuButton} from 'part:@sanity/components/menu-button'
import TrashIcon from 'part:@sanity/base/trash-icon'

import styles from './ConfirmButton.css'

// @todo
type DefaultButtonInstance = any
type DefaultButtonProps = Record<string, any>

export default function ConfirmButton(
  props: {placement?: Placement; onConfirm: () => void} & DefaultButtonProps
) {
  const {onConfirm, placement = 'left', ...restProps} = props
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<DefaultButtonInstance>(null)
  let timer

  useEffect(() => {
    if (open && buttonRef.current) buttonRef.current.focus()
  }, [open])

  const handleBlur = (e) => {
    timer = setTimeout(() => {
      setOpen(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      clearTimeout(timer)
    }
  }, [open])

  return (
    <MenuButton
      buttonProps={{
        ...restProps,
        icon: TrashIcon,
        padding: 'small',
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
      placement={placement}
      setOpen={setOpen}
    />
  )
}
