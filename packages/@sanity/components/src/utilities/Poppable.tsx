import PopperJS, {Modifier} from '@popperjs/core'
import React, {Fragment} from 'react'
import {Manager, Reference, Popper} from 'react-popper'
import CaptureOutsideClicks from './CaptureOutsideClicks'
import Escapable from './Escapable'
import {Portal} from './Portal'
import Stacked from './Stacked'

import styles from './Poppable.css'

type PopperModifiers = ReadonlyArray<Partial<Modifier<string, unknown>>>

interface PoppableProps {
  onEscape?: () => void
  onClickOutside?: (ev: MouseEvent) => void
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

// @todo: refactor to functional component
export default class Poppable extends React.Component<PoppableProps> {
  popperNode: HTMLElement | null = null

  setPopperNode = (node: HTMLElement | null) => {
    this.popperNode = node
  }

  handleClickOutside = (ev: MouseEvent) => {
    if (!this.popperNode || !ev.target) {
      return
    }

    if (!this.popperNode.contains(ev.target as Node)) {
      const {onClickOutside} = this.props

      if (onClickOutside) onClickOutside(ev)
    }
  }

  render() {
    const {
      onEscape,
      onClickOutside,
      children,
      referenceClassName,
      modifiers = DEFAULT_MODIFIERS,
      placement = 'bottom-start',
      popperClassName,
      referenceElement
    } = this.props

    // Undefined referenceElement causes Popper to think it is defined
    const popperPropHack: {referenceElement?: HTMLElement} = {}
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
