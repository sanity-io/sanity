import React from 'react'
import classNames from 'classnames'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {isValidationMarker, Marker, Path} from '@sanity/types'
import defaultStyles from 'part:@sanity/components/fieldsets/default-style'
import ArrowDropDown from 'part:@sanity/base/arrow-drop-down'
import DefaultLabel from 'part:@sanity/components/labels/default'
import ValidationStatus from 'part:@sanity/components/validation/status'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../../../../change-indicators'
import {FieldPresence, FormFieldPresence} from '../../../../presence'
import FieldStatus from './FieldStatus'

const EMPTY_ARRAY = []

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
  styles?: Record<string, string>
  markers?: Marker[]
  presence: FormFieldPresence[]
  changeIndicator: ChangeIndicatorContextProvidedProps | boolean
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
    markers: EMPTY_ARRAY,
    onFocus: undefined,
    styles: undefined,
    tabIndex: undefined,
    transparent: undefined,
    changeIndicator: true,
    presence: EMPTY_ARRAY,
  }

  constructor(props: FieldsetProps) {
    super(props)

    this.state = {
      isCollapsed: props.isCollapsed || false,
      hasBeenToggled: false,
    }
  }

  handleToggle = () => {
    this.setState((prevState) => ({
      isCollapsed: !prevState.isCollapsed,
      hasBeenToggled: true,
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
      if (this.props.onFocus) this.props.onFocus([FOCUS_TERMINATOR])
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
      changeIndicator,
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
      ...this.props.styles,
    }

    const validation = markers.filter(isValidationMarker)

    const rootClassName = classNames(
      styles.root,
      styles[`columns${columns}`],
      styles[`level${level}`],
      transparent && styles.transparent,
      this.props.onFocus && styles.canFocus,
      className
    )

    // Only show a summary of validation issues if field is collapsible and has been collapsed
    const showSummary = isCollapsible && isCollapsed
    // Hide the tooltip if field is collapsible, but field is not collapsed
    const hideTooltip = isCollapsible && !isCollapsed
    const childPresence = isCollapsible && isCollapsed ? presence : []
    return (
      <div
        {...rest}
        onFocus={this.handleFocus}
        tabIndex={isCollapsible && isCollapsed ? tabIndex : -1}
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
                  onKeyDown={(event) => (event.key === 'Enter' ? this.handleToggle() : false)}
                >
                  <div
                    className={styles.labelContainer}
                    onClick={isCollapsible ? this.handleToggle : undefined}
                    tabIndex={-1}
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
                    className={styles.validationStatus}
                    markers={
                      showSummary
                        ? validation.filter((marker) => marker.path.length <= level)
                        : validation.filter((marker) => marker.path.length < 1)
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
              {isCollapsible && (
                <FieldStatus>
                  <FieldPresence maxAvatars={4} presence={childPresence} />
                </FieldStatus>
              )}
            </div>

            {isCollapsible && !isCollapsed && (
              <div className={styles.content}>
                <div className={styles.fieldWrapper} data-columns={columns && columns > 1}>
                  {(hasBeenToggled || !isCollapsed) && children}
                </div>
              </div>
            )}

            {!isCollapsible && (
              <div className={styles.content}>
                {changeIndicator ? (
                  <ChangeIndicator {...changeIndicator}>
                    <div className={styles.fieldWrapper} data-columns={columns && columns > 1}>
                      {children}
                    </div>
                  </ChangeIndicator>
                ) : (
                  <div className={styles.fieldWrapper} data-columns={columns && columns > 1}>
                    {children}
                  </div>
                )}
              </div>
            )}
          </div>
        </fieldset>
      </div>
    )
  }
}
