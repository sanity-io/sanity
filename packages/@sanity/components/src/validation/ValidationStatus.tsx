/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/ValidationStatus.css'
import { Marker } from './types'

type Props = {
  markers: Marker[]
}

export default class ValidationStatus extends React.PureComponent<Props> {

  static defaultProps = {
    onClick: () => {},
    markers: []
  }

  render() {
    const {markers, onClick} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')

    if (errors.length === 0 && warnings.length === 0) {
      return (
        <div className={styles.ok}>
          <CheckIcon />
        </div>
      )
    }

    const errorDef = `error${errors.length === 1 ? '' : 's'}`
    const errorText = errors.length > 0 && `${errors.length} ${errorDef}`
    const warningDef = `warning${warnings.length === 1 ? '' : 's'}`
    const warningText = warnings.length > 0 && `${warnings.length} ${warningDef}`

    let tooltipText = errorText

    if (errorText && warningText) {
      tooltipText = `${errorText} and ${warningText}`
    }

    if (warningText && !errorText) {
      tooltipText = warningText
    }

    if (errors.length === 1 && warnings.length === 0) {
      tooltipText = errors[0].item.message
    }

    if (warnings.length === 1 && errors.length === 0) {
      tooltipText = warnings[0].item.message
    }

    return (
      <Tooltip title={tooltipText} tabIndex={0} arrow theme="light" className={styles.root} onClick={onClick}>
        <div className={styles.inner}>
          {errors && errors.length > 0 && (
            <div className={`${styles.icon} ${styles.error}`}>
              <ErrorOutlineIcon />
            </div>
          )}
          {warnings && warnings.length > 0 && (
            <div className={`${styles.icon} ${styles.warning}`}>
              <ErrorOutlineIcon />
            </div>
          )}
        </div>
      </Tooltip>
    )
  }
}
