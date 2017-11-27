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
    isExpanded: PropTypes.bool,
    fieldset: PropTypes.shape({
      description: PropTypes.string,
      legend: PropTypes.string
    }),
    children: PropTypes.node,
    level: PropTypes.number,
    className: PropTypes.string,
    transparent: PropTypes.bool,
    styles: PropTypes.object
  }

  constructor(props) {
    super()
    this.state = {
      isOpen: props.isExpanded !== false
    }

  }

  static defaultProps = {
    level: 1,
    fieldset: {},
    className: ''
  }

  handleToggle = () => {
    if (this.props.collapsable) {
      this.setState(prevState => ({isOpen: !prevState.isOpen}))
    }
  }

  render() {
    const {fieldset, legend, description, columns, level, className, children, isExpanded, collapsable, transparent, ...rest} = this.props

    const {isOpen} = this.state


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

    const canExpand = typeof isExpanded !== 'undefined'
    return (
      <fieldset {...rest} className={rootClassName} data-nesting-level={level}>
        <div className={styles.inner}>
          <legend className={`${styles.legend} ${isOpen ? styles.isOpen : ''}`} onClick={this.handleToggle}>
            {
              canExpand && (
                <div className={`${styles.arrow} ${isOpen ? styles.isOpen : ''}`}>
                  <ArrowDropDown />
                </div>
              )
            }
            {legend || fieldset.legend}
          </legend>
          {
            (description || fieldset.description) && (
              <p className={`${styles.description} ${isOpen ? styles.isOpen : ''}`}>
                {description || fieldset.description}
              </p>
            )
          }
          <div className={`${styles.content} ${isOpen ? styles.isOpen : ''}`}>
            <div className={styles.fieldWrapper}>
              {(!canExpand || isOpen) && children}
            </div>
          </div>
        </div>
      </fieldset>
    )
  }
}
