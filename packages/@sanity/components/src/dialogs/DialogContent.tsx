import classNames from 'classnames'
import styles from 'part:@sanity/components/dialogs/content-style'
import React from 'react'

interface DialogContentProps {
  size?: 'small' | 'medium' | 'large' | 'auto'
  padding?: 'none' | 'small' | 'medium' | 'large'
  children?: React.ReactNode
}

export default class DialogContent extends React.PureComponent<DialogContentProps> {
  componentDidMount() {
    console.warn('DialogContent is deprecated. Use `<DefaultDialog padding size />` instead.')
  }

  render() {
    const {size = 'auto', children, padding = 'medium'} = this.props

    return <div className={classNames(styles[size], styles[`padding_${padding}`])}>{children}</div>
  }
}
