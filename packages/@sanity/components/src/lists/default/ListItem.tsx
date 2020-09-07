import classNames from 'classnames'
import React from 'react'

import styles from '../styles/DefaultListItem.css'

export default class CoreListItem extends React.Component<React.HTMLProps<HTMLLIElement>> {
  ref = React.createRef<HTMLLIElement>()

  focus() {
    if (this.ref.current) this.ref.current.focus()
  }

  render() {
    return (
      <li
        {...this.props}
        ref={this.ref}
        className={classNames(styles.root, this.props.className)}
      />
    )
  }
}
