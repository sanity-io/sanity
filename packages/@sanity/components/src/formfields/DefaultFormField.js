/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/formfields/default-style'
import DefaultLabel from 'part:@sanity/components/labels/default'
import ValidationStatus from 'part:@sanity/components/validation/status'
import ValidationList from 'part:@sanity/components/validation/list'
import AnimateHeight from 'react-animate-height'

export default class DefaultFormField extends React.PureComponent {
  static propTypes = {
    label: PropTypes.string,
    className: PropTypes.string,
    inline: PropTypes.bool,
    description: PropTypes.string,
    level: PropTypes.number,
    children: PropTypes.node,
    wrapped: PropTypes.bool,
    labelFor: PropTypes.string,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string
      })
    )
  }

  static defaultProps = {
    level: 1,
    markers: []
  }

  state = {
    showValidationMessages: false
  }

  handleToggleShowValidation = event => {
    this.setState(prevState => ({
      showValidationMessages: !prevState.showValidationMessages
    }))
  }

  render() {
    const {
      level,
      label,
      labelFor,
      description,
      children,
      inline,
      wrapped,
      className,
      markers
    } = this.props

    const {showValidationMessages} = this.state

    const levelClass = `level_${level}`

    return (
      <div
        className={`
          ${inline ? styles.inline : styles.block}
          ${styles[levelClass] || ''}
          ${wrapped ? styles.wrapped : ''}
          ${className || ''}`}
      >
        <label className={styles.inner} htmlFor={labelFor}>
          {label && (
            <div className={styles.header}>
              <div className={styles.headerMain}>
                <div className={styles.title}>
                  {label && (
                    <DefaultLabel className={styles.label} level={level}>
                      {label}
                    </DefaultLabel>
                  )}
                  <div
                    onClick={this.handleToggleShowValidation}
                    className={styles.validationStatus}
                  >
                    <ValidationStatus markers={markers} />
                  </div>
                </div>
                {description && <div className={styles.description}>{description}</div>}
              </div>
            </div>
          )}
          <AnimateHeight
            height={showValidationMessages ? 'auto' : 0}
            contentClassName={styles.validationList}
            animateOpacity
          >
            <ValidationList markers={markers} />
          </AnimateHeight>
          <div className={styles.content}>{children}</div>
        </label>
      </div>
    )
  }
}
