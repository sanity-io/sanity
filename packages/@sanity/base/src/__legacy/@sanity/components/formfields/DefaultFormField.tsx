import React from 'react'
import classNames from 'classnames'
import {Marker} from '@sanity/types'
import styles from 'part:@sanity/components/formfields/default-style'
import DefaultLabel from 'part:@sanity/components/labels/default'
import ValidationStatus from 'part:@sanity/components/validation/status'
import {FieldPresence, FormFieldPresence} from '../../../../presence'
import {ChangeIndicator, ChangeIndicatorContextProvidedProps} from '../../../../change-indicators'
import FieldStatus from '../fieldsets/FieldStatus'

const EMPTY_MARKERS = []

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
  changeIndicator?: ChangeIndicatorContextProvidedProps | boolean
}

export default React.memo(function DefaultFormField({
  level = 1,
  label,
  labelFor,
  description,
  children,
  inline,
  wrapped,
  className,
  changeIndicator = true,
  markers = EMPTY_MARKERS,
  presence,
}: DefaultFormFieldProps) {
  const levelClass = `level_${level}`

  const rootClassName = classNames(
    className,
    inline ? styles.inline : styles.block,
    styles[levelClass],
    wrapped && styles.wrapped
  )

  return (
    <div className={rootClassName}>
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
                <ValidationStatus className={styles.validationStatus} markers={markers} />
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

      <div className={styles.content}>
        {changeIndicator ? (
          <ChangeIndicator {...changeIndicator}>{children}</ChangeIndicator>
        ) : (
          children
        )}
      </div>
    </div>
  )
})
