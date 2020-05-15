/* eslint-disable react/no-multi-comp, complexity, react/jsx-filename-extension */

import defaultStyles from 'part:@sanity/components/fieldsets/default-style'
import PropTypes from 'prop-types'
import React from 'react'
import ArrowDropDown from 'part:@sanity/base/arrow-drop-down'
import ValidationStatus from 'part:@sanity/components/validation/status'
import FieldStatus from './FieldStatus'
import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {FieldPresence} from '../presence'
import DefaultLabel from 'part:@sanity/components/labels/default'

export default class Fieldset extends React.PureComponent {
  static propTypes = {
    description: PropTypes.string,
    legend: PropTypes.string.isRequired,
    columns: PropTypes.number,
    isCollapsible: PropTypes.bool,
    onFocus: PropTypes.func,
    isCollapsed: PropTypes.bool,
    fieldset: PropTypes.shape({
      description: PropTypes.string,
      legend: PropTypes.string
    }),
    children: PropTypes.node,
    level: PropTypes.number,
    className: PropTypes.string,
    tabIndex: PropTypes.number,
    transparent: PropTypes.bool,
    styles: PropTypes.object,
    markers: PropTypes.array,
    presence: PropTypes.array
  }

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

  constructor(props) {
    super()
    this.state = {
      isCollapsed: props.isCollapsed,
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

  handleFocus = event => {
    if (event.target === this._focusElement) {
      // Make sure we don't trigger onFocus for child elements
      this.props.onFocus(event)
    }
  }

  focus() {
    this._focusElement.focus()
  }

  setFocusElement = el => {
    this._focusElement = el
  }

  render() {
    const {
      fieldset,
      legend,
      description,
      columns,
      level,
      className,
      isCollapsible,
      isCollapsed: _ignore,
      children,
      tabIndex,
      transparent,
      markers,
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
                  // eslint-disable-next-line react/jsx-no-bind
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
                    <DefaultLabel className={styles.label}>
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
                <FieldPresence presence={presence} />
              </FieldStatus>
            </div>

            {isCollapsible && !isCollapsed && (
              <div
                duration={250}
                height={isCollapsed && children ? 0 : 'auto'}
                className={styles.content}
              >
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
