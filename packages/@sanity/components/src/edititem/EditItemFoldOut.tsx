import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {Portal} from '../utilities/Portal'
import {Manager, Reference, Popper} from 'react-popper'
import {get} from 'lodash'

export default class EditItemFoldOut extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func
  }

  static defaultProps = {
    title: '',
    onClose() {} // eslint-disable-line
  }

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDown)
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown)
  }

  setRootElement = element => {
    this._rootElement = element
  }

  setPortalModalElement = element => {
    this._portalModalElement = element
  }

  render() {
    const {title, onClose, children} = this.props
    const isOpen = true
    return (
      <Manager>
        <Reference>{({ref}) => <div ref={ref} />}</Reference>
        {isOpen && (
          <Stacked>
            {isActive => (
              <Portal>
                <Popper
                  placement="bottom"
                  modifiers={{
                    preventOverflow: {
                      boundariesElement: 'viewport'
                    },
                    customStyle: {
                      enabled: true,
                      fn: data => {
                        const width = get(data, 'instance.reference.clientWidth') || 500
                        data.styles = {
                          ...data.styles,
                          width: width
                        }
                        return data
                      }
                    }
                  }}
                >
                  {({ref, style, placement, arrowProps}) => (
                    <div ref={ref} data-placement={placement} style={style} className={styles.root}>
                      <CaptureOutsideClicks
                        onClickOutside={isActive && isOpen ? this.handleClose : undefined}
                      >
                        <div className={styles.listContainer}>
                          <Escapable
                            onEscape={event => (isActive || event.shiftKey) && this.handleClose()}
                          />
                          <div className={styles.root}>
                            <div className={styles.wrapper}>
                              {title && (
                                <div className={styles.head}>
                                  {title}
                                  <button className={styles.close} type="button" onClick={onClose}>
                                    <CloseIcon />
                                  </button>
                                </div>
                              )}
                              {!title && (
                                <button
                                  className={styles.closeDark}
                                  type="button"
                                  onClick={this.handleClose}
                                >
                                  <CloseIcon />
                                </button>
                              )}
                              <div className={styles.content}>{children}</div>
                            </div>
                          </div>
                        </div>
                      </CaptureOutsideClicks>
                    </div>
                  )}
                </Popper>
              </Portal>
            )}
          </Stacked>
        )}
      </Manager>
    )
  }
}
