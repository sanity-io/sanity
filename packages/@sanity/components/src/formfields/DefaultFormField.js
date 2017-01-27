import React, {PropTypes} from 'react'

import styles from 'part:@sanity/components/formfields/default-style'
import DefaultLabel from 'part:@sanity/components/labels/default'
import {uniqueId} from 'lodash'

export default class DefaultFormField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    labelHtmlFor: PropTypes.string,
    className: PropTypes.string,
    inline: PropTypes.bool,
    description: PropTypes.string,
    level: PropTypes.number,
    children: PropTypes.node,
    wrapped: PropTypes.bool
  }

  static defaultProps = {
    level: 0
  }

  componentWillMount() {
    this._inputId = uniqueId('DefaultFormField')
  }

  render() {

    const {level, label, description, children, inline, labelHtmlFor, wrapped, className} = this.props

    const levelClass = `level_${level}`

    return (
      <div
        className={`
          ${inline ? styles.inline : styles.block}
          ${styles[levelClass] || ''}
          ${wrapped ? styles.wrapped : ''}
          ${className || ''}`
        }
      >
        <div className={styles.inner}>
          <div className={styles.labelAndDescriptionWrapper}>
            <DefaultLabel
              htmlFor={labelHtmlFor || this._inputId}
              className={styles.label}
              level={level}
            >
              {label}
            </DefaultLabel>

            {
              description
              && <div className={styles.description}>
                {description}
              </div>
            }
          </div>

          <div className={styles.content}>
            {children}
          </div>

        </div>
      </div>
    )
  }
}
