import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/ValidationList.css'
import ValidationListItem from './ValidationListItem'

export default class ValidationList extends React.PureComponent {
  static propTypes = {
    onFocus: PropTypes.func,
    onClose: PropTypes.func,
    showLink: PropTypes.bool,
    isOpen: PropTypes.bool,
    documentType: PropTypes.shape({
      fields: PropTypes.arrayOf(PropTypes.shape({name: PropTypes.string.isRequired}))
    }),
    markers: PropTypes.arrayOf(
      PropTypes.shape({
        path: PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number,
            PropTypes.shape({_key: PropTypes.string})
          ])
        ),
        type: PropTypes.string,
        level: PropTypes.string,
        item: PropTypes.any
      })
    )
  }

  static defaultProps = {
    markers: [],
    documentType: null,
    onClose: () => undefined,
    showLink: false,
    onFocus: () => undefined
  }

  componentWillUnmount() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
  }

  handleClick = (event, path) => {
    const {onFocus, onClose} = this.props
    const pathString = path[0]
    const element = document.querySelector(`[data-focus-path="${pathString}"]`)

    if (element) {
      element.scrollIntoView({behavior: 'smooth', alignToTop: false, inline: 'center'})
      this.scrollTimeout = setTimeout(() => {
        onFocus(path)
      }, 300)
    } else {
      onFocus(path)
    }
    onClose()
  }

  resolvePathTitle(path) {
    const type = this.props.documentType
    const fields = type && type.fields
    const field = fields && fields.find(curr => curr.name === path[0])
    return field ? field.type.title : ''
  }

  render() {
    const {markers, showLink, isOpen} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')

    if (errors.length === 0 && warnings.length === 0) {
      return <div />
    }

    return (
      <div className={styles.root}>
        <div className={styles.items}>
          <ul>
            {errors.length > 0 &&
              errors.map((error, i) => (
                <ValidationListItem
                  key={i}
                  // focus is not ready yet
                  // hasFocus={i === 0 && isOpen}
                  path={this.resolvePathTitle(error.path)}
                  marker={error}
                  onClick={this.handleClick}
                  showLink={showLink}
                />
              ))}

            {warnings.length > 0 &&
              warnings.map((warning, i) => (
                <ValidationListItem
                  key={i}
                  // focus is not ready yet
                  // hasFocus={i === 0 && isOpen}
                  path={this.resolvePathTitle(warning.path)}
                  marker={warning}
                  onClick={this.handleClick}
                  showLink={showLink}
                />
              ))}
          </ul>
        </div>
      </div>
    )
  }
}
