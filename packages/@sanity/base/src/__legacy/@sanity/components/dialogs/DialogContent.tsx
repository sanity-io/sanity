import classNames from 'classnames'
import styles from 'part:@sanity/components/dialogs/content-style'
import React, {useEffect} from 'react'

interface DialogContentProps {
  size?: 'small' | 'medium' | 'large' | 'auto'
  padding?: 'none' | 'small' | 'medium' | 'large'
  children?: React.ReactNode
}

function DialogContent(props: DialogContentProps) {
  const {size = 'auto', children, padding = 'medium'} = props

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.warn('DialogContent is deprecated. Use `<DefaultDialog padding size />` instead.')
  }, [])

  return <div className={classNames(styles[size], styles[`padding_${padding}`])}>{children}</div>
}

export default DialogContent
