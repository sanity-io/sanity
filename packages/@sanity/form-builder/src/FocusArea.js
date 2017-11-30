// @flow
import type {Node} from 'react'
import React from 'react'
import cx from 'classnames'
import styles from './styles/FocusArea.css'
import type {Path} from './typedefs/path'

type Props = {
  children: Node,
  className?: string,
  onFocus: ?(Path => void)
}

export class FocusArea extends React.Component<Props> {
  _element: ?HTMLDivElement

  focus() {
    if (this._element) {
      this._element.focus()
    }
  }

  handleFocus = (event: SyntheticEvent<HTMLDivElement>) => {
    const {onFocus} = this.props
    // Ignore events from children
    if (onFocus && this._element && event.target === this._element) {
      onFocus(event)
    }
  }

  setElement = (element: ?HTMLDivElement) => {
    // Only care about focus events from children
    this._element = element
  }

  render() {
    const {children, className, ...rest} = this.props
    const classNames = cx(className, styles.root)
    return (
      <div
        tabIndex={0}
        {...rest}
        className={classNames}
        ref={this.setElement}
        onFocus={this.handleFocus}
      >
        {children}
      </div>
    )
  }
}
