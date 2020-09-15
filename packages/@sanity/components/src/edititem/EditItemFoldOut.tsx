import React from 'react'
import styles from 'part:@sanity/components/edititem/fold-style'
import CloseIcon from 'part:@sanity/base/close-icon'
import {Manager, Reference, Popper} from 'react-popper'
import {get} from 'lodash'
import Stacked from '../utilities/Stacked'
import CaptureOutsideClicks from '../utilities/CaptureOutsideClicks'
import Escapable from '../utilities/Escapable'
import {Portal} from '../utilities/Portal'

interface EditItemFoldOutProps {
  title?: string
  children: React.ReactNode
  onClose?: () => void
}

// @todo: refactor to functional component
export default class EditItemFoldOut extends React.PureComponent<EditItemFoldOutProps> {
  render() {
    const {title = '', onClose, children} = this.props
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
                  modifiers={
                    {
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
                    } as any
                  }
                >
                  {({ref, style, placement}) => (
                    <div ref={ref} data-placement={placement} style={style} className={styles.root}>
                      <CaptureOutsideClicks
                        onClickOutside={isActive && isOpen ? onClose : undefined}
                      >
                        <div className={styles.listContainer}>
                          <Escapable
                            onEscape={event => (isActive || event.shiftKey) && onClose && onClose()}
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
                                  onClick={onClose}
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
