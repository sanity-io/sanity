import React from 'react'
import {Marker} from '../types'
import ValidationListItem from './ValidationListItem'

import styles from './ValidationList.css'

type Props = {
  kind?: string
  onFocus?: (path: any) => void
  onClose?: () => void
  showLink?: boolean
  truncate?: boolean
  documentType?: {
    fields: {
      name: string
      type: any
    }[]
  }
  markers: Marker[]
}

export default class ValidationList extends React.PureComponent<Props> {
  static defaultProps = {
    markers: [],
    documentType: null,
    onClose: () => undefined,
    showLink: false,
    onFocus: () => undefined
  }
  scrollTimeout: any

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
      element.scrollIntoView({behavior: 'smooth', inline: 'center'})
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout)
      }
      this.scrollTimeout = setTimeout(() => {
        if (onFocus) onFocus(path)
        if (onClose) onClose()
      }, 300)
    } else {
      if (onFocus) onFocus(path)
      if (onClose) onClose()
    }
  }

  resolvePathTitle(path) {
    const type = this.props.documentType
    const fields = type && type.fields
    const field = fields && fields.find(curr => curr.name === path[0])
    return field ? field.type.title : ''
  }

  render() {
    const {kind, markers, showLink, truncate} = this.props
    const validation = markers.filter(marker => marker.type === 'validation')
    const errors = validation.filter(marker => marker.level === 'error')
    const warnings = validation.filter(marker => marker.level === 'warning')

    if (errors.length === 0 && warnings.length === 0) {
      return <div />
    }

    return (
      <ul className={styles.root} data-kind={kind}>
        {errors.length > 0 &&
          errors.map((error, i) => (
            <li className={styles.item} key={i}>
              <ValidationListItem
                kind={kind}
                truncate={truncate}
                path={this.resolvePathTitle(error.path)}
                marker={error}
                onClick={this.handleClick}
                showLink={showLink}
              />
            </li>
          ))}

        {warnings.length > 0 &&
          warnings.map((warning, i) => (
            <li className={styles.item} key={i}>
              <ValidationListItem
                kind={kind}
                truncate={truncate}
                path={this.resolvePathTitle(warning.path)}
                marker={warning}
                onClick={this.handleClick}
                showLink={showLink}
              />
            </li>
          ))}
      </ul>
    )
  }
}
