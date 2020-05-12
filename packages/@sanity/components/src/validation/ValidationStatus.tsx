/* eslint-disable complexity */
import React from 'react'
import ErrorOutlineIcon from 'part:@sanity/base/error-outline-icon'
import CheckIcon from 'part:@sanity/base/check-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/ValidationStatus.css'
import {Marker} from '../typedefs'
import ValidationList from './ValidationList'

type Props = {
  hideTooltip?: boolean
  showSummary?: boolean
  markers: Marker[]
}

export default class ValidationStatus extends React.PureComponent<Props> {
  static defaultProps = {
    markers: []
  }

  render() {
    const {markers, showSummary = false, hideTooltip = false} = this.props
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
    const warningDef = `warning${warnings.length === 1 ? '' : 's'}`
    const errorText = errors.length > 0 ? `${errors.length} validation ${errorDef}` : ''
    const warningText = warnings.length > 0 ? `${warnings.length} ${warningDef}` : ''

    const tooltipText = `There are ${errorText} ${
      warningText !== '' ? `and ${warningText}` : ''
    }${showSummary && ' in this list'}`

    const iconStyle = errors?.length < 1 && warnings?.length > 0 ? styles.warning : styles.error

    const TooltipText = () => (
      <div className={styles.tooltipText}>
        <div className={`${styles.icon} ${iconStyle}`}>
          <ErrorOutlineIcon />
        </div>
        {tooltipText}
      </div>
    )

    return (
      <Tooltip
        tabIndex={0}
        arrow
        theme="light"
        className={styles.root}
        disabled={hideTooltip}
        html={showSummary ? <TooltipText /> : <ValidationList markers={validation} kind="simple" />}
      >
        <div className={styles.inner}>
          {validation && validation.length > 0 && (
            <div className={`${styles.icon} ${iconStyle}`}>
              <ErrorOutlineIcon />
            </div>
          )}
        </div>
      </Tooltip>
    )
  }
}
