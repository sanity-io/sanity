import React, {PropTypes} from 'react'

import styles from 'style:@sanity/components/formfields/default'
import DefaultLabel from 'component:@sanity/components/labels/default'

export default class DefaultFormField extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    labelHtmlFor: PropTypes.string.isRequired,
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

  render() {

    const {level, label, description, children, inline, labelHtmlFor, wrapped, className} = this.props

    const levelClass = `level_${level}`

    return (
      <div className={`${inline ? styles.inline : styles.block} ${wrapped && styles.wrapped} ${levelClass} ${className}`}>
        <div className={styles.inner}>
          <div className={styles.labelAndDescriptionWrapper}>
            <DefaultLabel
              htmlFor={labelHtmlFor}
              className={styles.label}
              level={level}
            >
              {label}
            </DefaultLabel>

            <div className={styles.description}>
              {description}
            </div>
          </div>

          <div className={styles.content}>
            {children}
          </div>

        </div>
      </div>
    )
  }
}
