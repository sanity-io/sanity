import PropTypes from 'prop-types'
import React from 'react'

import styles from 'part:@sanity/components/formfields/default-style'
import DefaultLabel from 'part:@sanity/components/labels/default'

export default class DefaultFormField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    className: PropTypes.string,
    inline: PropTypes.bool,
    description: PropTypes.string,
    level: PropTypes.number,
    children: PropTypes.node,
    wrapped: PropTypes.bool
  }

  static defaultProps = {
    level: 1
  }

  render() {

    const {level, label, description, children, inline, wrapped, className} = this.props

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
        <label className={styles.inner}>
          <div className={styles.labelAndDescriptionWrapper}>
            {label && <DefaultLabel
              className={styles.label}
              level={level}
            >
              {label}
            </DefaultLabel>}

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

        </label>
      </div>
    )
  }
}
