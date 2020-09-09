import {FieldPresence, FormFieldPresence} from '@sanity/base/presence'
import classNames from 'classnames'
import styles from 'part:@sanity/components/formfields/default-style'
import DefaultLabel from 'part:@sanity/components/labels/default'
import ValidationStatus from 'part:@sanity/components/validation/status'
import React from 'react'
import FieldStatus from '../fieldsets/FieldStatus'
import {Marker} from '../types'

interface DefaultFormFieldProps {
  label?: string
  className?: string
  inline?: boolean
  description?: string
  level?: number
  children?: React.ReactNode
  wrapped?: boolean
  labelFor?: string
  markers?: Marker[]
  presence?: FormFieldPresence[]
}

export default class DefaultFormField extends React.PureComponent<DefaultFormFieldProps> {
  render() {
    const {
      level = 1,
      label,
      labelFor,
      description,
      children,
      inline,
      wrapped,
      className: classNameProp,
      markers = [],
      presence
    } = this.props

    const levelClass = `level_${level}`

    const className = classNames(
      classNameProp,
      inline ? styles.inline : styles.block,
      styles[levelClass],
      wrapped && styles.wrapped
    )

    return (
      <div className={className}>
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
                  <ValidationStatus markers={markers} />
                </div>
                {description && <div className={styles.description}>{description}</div>}
              </div>
              {presence && (
                <FieldStatus>
                  <FieldPresence maxAvatars={4} presence={presence} />
                </FieldStatus>
              )}
            </div>
          )}
        </label>

        <div className={styles.content}>{children}</div>
      </div>
    )
  }
}
