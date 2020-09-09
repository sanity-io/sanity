/* eslint-disable complexity */

import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import defaultStyles from 'part:@sanity/components/fieldsets/default-style'
import React from 'react'
import ArrowDropDown from 'part:@sanity/base/arrow-drop-down'
import ValidationStatus from 'part:@sanity/components/validation/status'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import DefaultLabel from 'part:@sanity/components/labels/default'
import {Marker, Path} from '../types'
import FieldStatus from './FieldStatus'

interface FieldsetProps {
  description?: string
  legend: string
  columns?: number
  isCollapsible?: boolean
  onFocus?: (path: Path) => void
  isCollapsed?: boolean
  fieldset: {
    description?: string
    legend?: string
  }
  children?: React.ReactNode
  level?: number
  className?: string
  tabIndex?: number
  transparent?: boolean
  styles?: object
  markers?: Marker[]
  presence: FormFieldPresence[]
}

interface State {
  isCollapsed: boolean
  hasBeenToggled: boolean
}

export default class Fieldset extends React.PureComponent<FieldsetProps, State> {
  _focusElement: HTMLDivElement | null = null

  static defaultProps = {
    children: undefined,
    className: '',
    columns: undefined,
    description: undefined,
    level: 1,
    fieldset: {},
    isCollapsed: false,
    isCollapsible: false, // can collapsing be toggled by user?
    markers: [],
    onFocus: undefined,
    styles: undefined,
    tabIndex: undefined,
    transparent: undefined,
    presence: []
  }

  constructor(props: FieldsetProps) {
    super(props)

    this.state = {
      isCollapsed: props.isCollapsed || false,
      hasBeenToggled: false
    }
  }

  handleToggle = () => {
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed,
      hasBeenToggled: true
    }))

    // Let parent know field has been toggled
    const {onFocus} = this.props
    if (onFocus) {
      onFocus([FOCUS_TERMINATOR])
    }
  }

  handleFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    // Make sure we don't trigger onFocus for child elements
    if (event.target === this._focusElement) {
      // @todo: don't call with `event` here?
      if (this.props.onFocus) this.props.onFocus(event as any)
    }
  }

  focus() {
    if (this._focusElement) this._focusElement.focus()
  }

  setFocusElement = (el: HTMLDivElement | null) => {
    this._focusElement = el
  }

  render() {
    const {
      fieldset,
      legend,
      description,
      columns,
      level = 1,
      className,
      isCollapsible,
      isCollapsed: _ignore,
      children,
      tabIndex,
      transparent,
      markers = [],
      presence,
      ...rest
    } = this.props

    const {isCollapsed, hasBeenToggled} = this.state

    const styles = {
      ...defaultStyles,
      ...this.props.styles
    }

    const validation = markers.filter(marker => marker.type === 'validation')
    // const errors = validation.filter(marker => marker.level === 'error')

    const rootClassName = [
      styles.root,
      styles[`columns${columns}`],
      styles[`level${level}`],
      transparent && styles.transparent,
      this.props.onFocus && styles.canFocus,
      className
    ]
      .filter(Boolean)
      .join(' ')

    // Only show a summary of validation issues if field is collapsible and has been collapsed
    const showSummary = isCollapsible && isCollapsed
    // Hide the tooltip if field is collapsible, but field is not collapsed
    const hideTooltip = isCollapsible && !isCollapsed
    return (
      <div
        {...rest}
        onFocus={this.handleFocus}
        tabIndex={tabIndex}
        ref={this.setFocusElement}
        className={rootClassName}
      >
        <fieldset className={styles.fieldset}>
          <div className={styles.inner}>
            <div className={styles.header}>
              <div className={styles.headerMain}>
                <legend
                  className={`${styles.legend} ${isCollapsed ? '' : styles.isOpen}`}
                  // Uses the tabIndex 0 and -1 here to avoid focus state on click
                  tabIndex={isCollapsible ? 0 : undefined}
                  onKeyDown={event => (event.key === 'Enter' ? this.handleToggle() : false)}
                >
                  <div
                    tabIndex={-1}
                    onClick={isCollapsible ? this.handleToggle : undefined}
                    style={{outline: 'none', display: 'flex', alignItems: 'center'}}
                  >
                    {isCollapsible && (
                      <div className={`${styles.arrow} ${isCollapsed ? '' : styles.isOpen}`}>
                        <ArrowDropDown />
                      </div>
                    )}
                    <DefaultLabel className={styles.label} level={1}>
                      {legend || fieldset.legend}
                    </DefaultLabel>
                  </div>
                  <ValidationStatus
                    markers={
                      showSummary
                        ? validation.filter(marker => marker.path.length <= level)
                        : validation.filter(marker => marker.path.length < 1)
                    }
                    showSummary={showSummary}
                    hideTooltip={hideTooltip}
                  />
                </legend>

                {(description || fieldset.description) && (
                  <p className={`${styles.description} ${isCollapsed ? '' : styles.isOpen}`}>
                    {description || fieldset.description}
                  </p>
                )}
              </div>
              <FieldStatus>
                <FieldPresence maxAvatars={4} presence={presence} />
              </FieldStatus>
            </div>

            {isCollapsible && !isCollapsed && (
              <div className={styles.content}>
                <div className={styles.fieldWrapper}>
                  {(hasBeenToggled || !isCollapsed) && children}
                </div>
              </div>
            )}

            {!isCollapsible && (
              <div className={styles.content}>
                <div className={styles.fieldWrapper}>{children}</div>
              </div>
            )}
          </div>
        </fieldset>
      </div>
    )
  }
}
