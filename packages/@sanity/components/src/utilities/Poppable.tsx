import PopperJS, {Modifier} from '@popperjs/core'
import React, {Fragment} from 'react'
import {Manager, Reference, Popper} from 'react-popper'
import CaptureOutsideClicks from './CaptureOutsideClicks'
import Escapable from './Escapable'
import {Portal} from './Portal'
import Stacked from './Stacked'

import styles from './styles/Poppable.css'

type PopperModifiers = ReadonlyArray<Partial<Modifier<string, any>>>

interface PoppableProps {
  onEscape?: () => void
  onClickOutside?: (ev: React.MouseEvent<HTMLElement>) => void
  target?: React.ReactNode
  children?: React.ReactNode
  referenceClassName?: string
  referenceElement?: HTMLElement
  placement?: PopperJS.Placement
  positionFixed?: boolean
  popperClassName?: string
  modifiers?: PopperModifiers
}

const DEFAULT_MODIFIERS: PopperModifiers = [
  {
    name: 'preventOverflow',
    options: {
      boundaryElement: 'viewport'
    }
  }
]

export default class Poppable extends React.Component<PoppableProps> {
  popperNode: any = null

  setPopperNode = (node: any) => {
    this.popperNode = node
  }

  handleClickOutside = (ev: React.MouseEvent<HTMLElement>) => {
    if (!this.popperNode || !ev.target) {
      return
    }

    if (!this.popperNode.contains(ev.target)) {
      const {onClickOutside} = this.props

      if (onClickOutside) onClickOutside(ev)
    }
  }

  render() {
    const {
      onEscape,
      onClickOutside,
      target,
      children,
      referenceClassName,
      modifiers = DEFAULT_MODIFIERS,
      placement = 'bottom-start',
      popperClassName,
      referenceElement
    } = this.props

    // Undefined referenceElement causes Popper to think it is defined
    const popperPropHack: {referenceElement?: any} = {}
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
                    modifiers={modifiers}
                    placement={placement}
                    // positionFixed
                    {...popperPropHack}
                  >
                    {({ref, placement: placementState, style}) => (
                      <div
                        ref={ref}
                        style={style}
                        data-placement={placementState}
                        className={popperClassName}
                      >
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
