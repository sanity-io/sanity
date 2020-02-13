import React from 'react'
import PropTypes from 'prop-types'
import {Tooltip} from 'react-tippy'
import Button from 'part:@sanity/components/buttons/default'
import LanguageFilter from 'part:@sanity/desk-tool/language-select-component?'
import ValidationList from 'part:@sanity/components/validation/list'
import ChevronDown from 'part:@sanity/base/chevron-down-icon'
import WarningIcon from 'part:@sanity/base/warning-icon'
import styles from '../styles/Editor.css'

export default class Actions extends React.PureComponent {
  static propTypes = {
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.array
      })
    ).isRequired,
    onCloseValidationResults: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onToggleValidationResults: PropTypes.func.isRequired,
    showValidationTooltip: PropTypes.bool.isRequired,
    type: PropTypes.object.isRequired
  }

  renderErrors() {
    const {
      onCloseValidationResults,
      onFocus,
      onToggleValidationResults,
      markers,
      showValidationTooltip,
      type
    } = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')
    if (errors.length === 0 && warnings.length === 0) {
      return null
    }
    return (
      <Tooltip
        arrow
        theme="light noPadding"
        trigger="click"
        position="bottom"
        interactive
        duration={100}
        open={showValidationTooltip}
        onRequestClose={onCloseValidationResults}
        html={
          <ValidationList
            truncate
            markers={validation}
            showLink
            isOpen={showValidationTooltip}
            documentType={type}
            onClose={onCloseValidationResults}
            onFocus={onFocus}
          />
        }
      >
        <Button
          color="danger"
          bleed
          icon={WarningIcon}
          padding="small"
          onClick={onToggleValidationResults}
        >
          {errors.length}
          <span style={{paddingLeft: '0.5em', display: 'flex'}}>
            <ChevronDown />
          </span>
        </Button>
      </Tooltip>
    )
  }

  render() {
    return (
      <div className={styles.paneFunctions}>
        {LanguageFilter && <LanguageFilter />}
        {this.renderErrors()}
      </div>
    )
  }
}
