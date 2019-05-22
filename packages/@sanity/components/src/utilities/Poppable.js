import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {Manager, Reference, Popper} from 'react-popper'
import styles from './styles/Poppable.css'
import Stacked from './Stacked'
import Escapable from './Escapable'
import CaptureOutsideClicks from './CaptureOutsideClicks'

import {Portal} from './Portal'

export default class Poppable extends React.Component {
  static propTypes = {
    onEscape: PropTypes.func,
    onClickOutside: PropTypes.func,
    target: PropTypes.node,
    children: PropTypes.node,
    referenceClassName: PropTypes.string,
    // When requiring this file in node, Element is undefined (since it's a window global)
    referenceElement: typeof window === 'undefined' ? PropTypes.any : PropTypes.instanceOf(Element),
    placement: PropTypes.string,
    positionFixed: PropTypes.bool,
    popperClassname: PropTypes.string,
    modifiers: PropTypes.shape({
      preventOverflow: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      customStyle: PropTypes.object,
      flip: PropTypes.object,
      offset: PropTypes.object
    })
  }

  popperNode = undefined

  static defaultProps = {
    placement: 'bottom-start',
    modifiers: {preventOverflow: 'viewport'}
  }

  setPopperNode = node => {
    this.popperNode = node
  }

  handleClickOutside = ev => {
    if (!this.popperNode || !ev.target) {
      return
    }
    if (!this.popperNode.contains(ev.target)) {
      this.props.onClickOutside(ev)
    }
  }
  render() {
    const {onEscape, onClickOutside, target, children, referenceClassName, popperClassName, referenceElement} = this.props

    // Undefined referenceElement causes Popper to think it is defined
    const popperPropHack = {}
    if (referenceElement) {
      popperPropHack.referenceElement = referenceElement
    }

    return (
      <Manager>
        {!referenceElement && (
          <Reference>{({ref}) => <div ref={ref} className={referenceClassName} />}</Reference>
        )}
        {children && (
          <Portal>
            <Stacked>
              {isActive => (
                <div className={styles.portal}>
                  <Popper
                    innerRef={this.setPopperNode}
                    modifiers={this.props.modifiers}
                    placement={this.props.placement}
                    positionFixed
                    {...popperPropHack}
                  >
                    {({ref, placement, style}) => (
                      <div ref={ref} style={style} data-placement={placement} className={popperClassName}>
                        <Fragment>
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
                        </Fragment>
                      </div>
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
