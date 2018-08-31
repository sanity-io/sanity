import React from 'react'
import {Manager, Target, Popper} from 'react-popper'
import styles from './styles/Poppable.css'
import Stacked from './Stacked'
import Escapable from './Escapable'
import CaptureOutsideClicks from './CaptureOutsideClicks'

import {Portal} from './Portal'

export default class Poppable extends React.Component {
  targetRef = React.createRef()
  static defaultProps = {
    placement: 'bottom-start',
    modifiers: {
      preventOverflow: 'viewport'
    }
  }
  handleClickOutside = ev => {
    if (!this.targetRef.current.contains(ev.target)) {
      this.props.onClickOutside(ev)
    }
  }
  render() {
    const {onEscape, placement, modifiers, onClickOutside, target, children} = this.props

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
                  <Popper placement={placement} modifiers={modifiers}>
                    <Escapable onEscape={isActive ? onEscape : undefined} />
                    {onClickOutside ? (
                      <CaptureOutsideClicks
                        onClickOutside={isActive ? this.handleClickOutside : undefined}
                      >
                        {children}
                      </CaptureOutsideClicks>
                    ) : (
                      children
                    )}
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
