import React from 'react'
import cx from 'classnames'
import filesize from 'filesize'
import ProgressBar from './ProgressBar'
import _t from '../../../lib/translate'._t
const PropTypes = React.PropTypes

export default React.createClass({
  displayName: 'ProgressTracker',
  propTypes: {
    progress: PropTypes.shape({
      percent: PropTypes.number,
      error: PropTypes.instanceOf(Error),
      file: PropTypes.shape({
        name: PropTypes.string,
        size: PropTypes.number
      })
    }),
    preview: PropTypes.node,
    onRetry: PropTypes.func,
    onCancel: PropTypes.func
  },
  getInitialState() {
    return {showErrorDetails: false}
  },
  toggleShowErrorDetails(e) {
    e.preventDefault()
    this.setState({showErrorDetails: !this.state.showErrorDetails})
  },
  handleCancel(e) {
    if (this.props.onCancel) {
      this.props.onCancel(this.props.progress)
    }
  },
  handleRetry(e) {
    if (this.props.onRetry) {
      const {progress} = this.props
      this.props.onRetry(progress)
    }
  },
  render() {
    const {progress, onCancel, onRetry, preview} = this.props
    const {showErrorDetails} = this.state

    const PreviewComponent = preview

    const completed = progress.percent == 100
    return (
      <div className={cx({'progress-tracker': true, 'progress-tracker--completed': completed, error: progress.error})}>
        {PreviewComponent && <PreviewComponent file={progress.file}/>}
        <ProgressBar percent={progress.percent}/>
        <div className="progress-tracker__percent">
          {Math.round(progress.percent)}%
        </div>
        <div className="progress-tracker__file-info">
          <span className="progress-tracker__file-name">{progress.file.name} </span>
          <span className="progress-tracker__file-size">({filesize(progress.file.size, {round: 1})})</span>
        </div>
        {
          !completed && onCancel && (
            <button className="button button--negative cancel progress-tracker__cancel-button" type="button" onClick={this.handleCancel}>
              {_t('common.cancel')}
            </button>
          )
        }
        {progress.error && (
          <div className="error">
            <div className="error-message">{progress.humanReadableError || progress.error.message}</div>
            <div className="error-details">
              <a href="#" onClick={this.toggleShowErrorDetails}>
                {showErrorDetails ? 'Hide' : 'Show'} details…
              </a>
              {showErrorDetails && (
                <div className="error-stack">
                  {progress.error.stack}
                </div>
              )}
            </div>
            {onRetry && (
              <button className="button progress-tracker__retry-button" type="button" onClick={this.handleRetry}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
})
