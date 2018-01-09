/* eslint-disable react/no-multi-comp */

import defaultStyles from 'part:@sanity/components/fieldsets/default-style'
import PropTypes from 'prop-types'
import React from 'react'
import ArrowDropDown from 'part:@sanity/base/arrow-drop-down'

export default class Fieldset extends React.Component {
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
    styles: PropTypes.object
  }

  static defaultProps = {
    level: 1,
    fieldset: {},
    className: '',
    isCollapsed: false,
    isCollapsible: false // can collapsing be toggled by user?
  }

  constructor(props) {
    super()
    this.state = {
      isCollapsed: props.isCollapsed
    }
  }

  handleToggle = () => {
    this.setState(prevState => ({isCollapsed: !prevState.isCollapsed}))
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
      ...rest
    } = this.props

    const {isCollapsed} = this.state

    const styles = {
      ...defaultStyles,
      ...this.props.styles
    }

    const rootClassName = [
      styles.root,
      styles[`columns${columns}`],
      styles[`level${level}`],
      transparent && styles.transparent,
      className
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        {...rest}
        onFocus={this.handleFocus}
        tabIndex={tabIndex}
        ref={this.setFocusElement}
        className={rootClassName}
      >
        <fieldset className={styles.fieldset}>
          <div
            className={styles.inner}
          >
            <legend
              className={`${styles.legend} ${isCollapsed ? '' : styles.isOpen}`}
              onClick={isCollapsible && this.handleToggle}
            >
              {isCollapsible && (
                <div className={`${styles.arrow} ${isCollapsed ? '' : styles.isOpen}`}>
                  <ArrowDropDown />
                </div>
              )}
              {legend || fieldset.legend}
            </legend>
            {(description || fieldset.description) && (
              <p className={`${styles.description} ${isCollapsed ? '' : styles.isOpen}`}>
                {description || fieldset.description}
              </p>
            )}
            <div className={`${styles.content} ${isCollapsed ? '' : styles.isOpen}`}>
              <div className={styles.fieldWrapper}>
                {!isCollapsed && children}
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    )
  }
}
