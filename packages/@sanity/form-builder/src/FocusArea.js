// @flow
import React from 'react'
import {createUploadTarget} from './utils/createUploadTarget'
import cx from 'classnames'
import styles from './styles/FocusArea.css'

type Props = {
  className: string
}

export const FocusArea = createUploadTarget(class FocusArea extends React.Component<Props> {
  setElement = el => {
    this._element = el
  }
  focus() {
    this._element.focus()
  }
  render() {
    const className = cx(this.props.className, styles.root)

    return <div {...this.props} className={className} tabIndex={0} ref={this.setElement} />
  }
})
