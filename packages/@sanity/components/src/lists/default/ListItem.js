// @flow
import React from 'react'
import styles from '../styles/DefaultListItem.css'
import classNames from 'classnames'

export default class CoreListItem extends React.Component<any> {
  ref = React.createRef()
  focus() {
    this.ref.current.focus()
  }
  render() {
    return <li {...this.props} ref={this.ref} className={classNames([styles.root, this.props.className])} />
  }
}
