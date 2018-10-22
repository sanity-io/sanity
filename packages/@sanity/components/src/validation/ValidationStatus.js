/* eslint-disable complexity */
import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/ValidationStatus.css'
import WarningIcon from 'part:@sanity/base/warning-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import {Tooltip} from 'react-tippy'

export default class ValidationStatus extends React.PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.arrayOf(
          PropTypes.oneOfType([PropTypes.object, PropTypes.string, PropTypes.number])
        ),
        type: PropTypes.string,
        level: PropTypes.string,
        item: PropTypes.any
      })
    )
  }

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
      <Tooltip
        title={tooltipText}
        tabIndex={0}
        trigger="mouseenter focus"
        animation="scale"
        arrow
        theme="light"
        distance="2"
        duration={50}
        className={styles.root}
        onClick={onClick}
      >
        <div>
          {errors &&
            errors.length > 0 && (
              <div className={styles.error}>
                <WarningIcon />
              </div>
            )}
          {warnings &&
            warnings.length > 0 && (
              <div className={styles.warning}>
                <WarningIcon />
              </div>
            )}
        </div>
      </Tooltip>
    )
  }
}
