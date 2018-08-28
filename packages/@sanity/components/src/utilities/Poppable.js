import React from 'react'
import styles from './styles/Poppable.css'
import Stacked from './Stacked'
import Escapable from './Escapable'
import CaptureOutsideClicks from './CaptureOutsideClicks'

import {Manager, Target, Popper} from 'react-popper'
import {Portal} from './Portal'

export default class Poppable extends React.Component {
  targetRef = React.createRef()
  static defaultProps = {
    placement: 'bottom-start'
  }
  handleClickOutside = ev => {
    if (!this.targetRef.current.contains(ev.target)) {
      this.props.onClickOutside(ev)
    }
  }
  render() {
    const {onEscape, placement, onClickOutside, target, children} = this.props

    return (
      <Manager>
        <Target>
          <div ref={this.targetRef}>{target}</div>
        </Target>
        {children && (
          <Portal>
            <Stacked>
              {isActive => (
                <div className={styles.portal}>
                  <Popper placement={placement}>
                    <Escapable onEscape={isActive ? onEscape : undefined} />
                    <CaptureOutsideClicks
                      onClickOutside={isActive ? this.handleClickOutside : undefined}
                    >
                      {children}
                    </CaptureOutsideClicks>
                  </Popper>
                </div>
              )}
            </Stacked>
          </Portal>
        )}
      </Manager>
    )
  }
}
