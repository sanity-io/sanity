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

  focus() {
    this.fieldSetEl.focus()
    console.log('focused fieldset')
  }

  setFieldset = el => {
    this.fieldSetEl = el
  }

  handleToggle = () => {
    this.setState(prevState => ({isOpen: !prevState.isOpen}))
  }

  render() {
    const {fieldset, legend, description, columns, level, className, children, isExpanded, transparent, ...rest} = this.props
    const styles = {
      ...defaultStyles,
      ...this.props.styles
    }
    const {isOpen} = this.state
    const levelString = `level${level}`
    const rootClass = `
      ${styles.root}
      ${styles[`columns${columns}`] || ''}
      ${styles[levelString] || ''}
      ${transparent ? styles.transparent : ''}
      ${className || ''}
    `
    const canExpand = typeof isExpanded !== 'undefined'
    return (
      <fieldset {...rest} tabIndex={0} className={rootClass} ref={this.setFieldset} data-nesting-level={level}>
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
              {isOpen && children}
            </div>
          </div>
        </div>
      </fieldset>
    )
  }
}
