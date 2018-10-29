/* eslint-disable complexity */
import PropTypes from 'prop-types'
import React from 'react'
import formatDate from 'date-fns/format'
import {debounce, truncate} from 'lodash'
import styles from 'part:@sanity/components/previews/card-style'
import elementResizeDetectorMaker from 'element-resize-detector'

let index = 0

const svgStyles = {
  position: 'relative',
  width: '100%',
  height: '100%'
}

const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class CardPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    description: fieldProp,
    date: PropTypes.instanceOf(Date),
    status: fieldProp,
    media: fieldProp,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'fill', 'fillmax', 'max', 'scale', 'min']),
      aspect: PropTypes.number
    }),
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    title: 'Untitled',
    subtitle: undefined,
    description: undefined,
    date: undefined,
    status: undefined,
    media: undefined,
    isPlaceholder: false,
    children: undefined,
    mediaDimensions: {width: 300, height: 225, aspect: 4 / 3, fit: 'crop'}
  }

  index = index++
  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

  state = {
    emWidth: 10
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.isPlaceholder && this.dateElement) {
      this._elementResizeDetector.uninstall(this.dateElement)
    }

    if (!nextProps.isPlaceholder && this.dateElement) {
      this._elementResizeDetector.listenTo(this.dateElement, this.onResize)
    }
  }

  componentWillUnmount() {
    this._elementResizeDetector.uninstall(this.dateElement)
  }

  setDateElement = element => {
    this.dateElement = element
    if (element) {
      this._elementResizeDetector.listenTo(this.dateElement, this.onResize)
    }
  }

  onResize = debounce(() => {
    const el = this.dateElement
    if (el) {
      const fontSize = window
        .getComputedStyle(el, null)
        .getPropertyValue('font-size')
        .split('px')[0]
      const emWidth = el.offsetWidth / fontSize
      this.setState({
        emWidth: Math.round(emWidth)
      })
    }
  }, 1000 / 60)

  render() {
    const {
      title,
      subtitle,
      description,
      date,
      media,
      mediaDimensions,
      children,
      isPlaceholder,
      status
    } = this.props
    const {emWidth} = this.state
    const aspect = mediaDimensions.aspect

    if (isPlaceholder) {
      return (
        <div className={styles.placeholder}>
          <div className={styles.svg} style={svgStyles}>
            {media && (
              <div className={styles.media}>
                {aspect && (
                  <div
                    className={styles.mediaPadding}
                    style={{
                      paddingTop: `${100 / aspect}%`
                    }}
                  />
                )}
                <div className={styles.mediaContent} />
              </div>
            )}
            <div className={styles.meta}>
              <div className={styles.heading}>
                <div className={styles.title}>&nbsp;</div>
                <div className={styles.date}>&nbsp;</div>
              </div>
              <div className={styles.subtitle}>&nbsp;</div>
              <div className={styles.description_1}>&nbsp;</div>
              <div className={styles.description_2}>&nbsp;</div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={styles.root}>
        <div className={styles.inner}>
          {media && (
            <div className={styles.media}>
              <div
                className={styles.mediaPadding}
                style={{
                  paddingTop: `${100 / aspect}%`
                }}
              />
              <div className={aspect ? styles.mediaContent : styles.mediaContentRelative}>
                {typeof media === 'function' &&
                  media({dimensions: mediaDimensions, layout: 'default'})}
                {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
                {React.isValidElement(media) && media}
              </div>
            </div>
          )}
          <div className={styles.meta}>
            {date && (
              <div
                ref={this.setDateElement}
                className={styles.date}
                title={formatDate(date, 'ddd, MMM Do, YYYY hh:mm A')}
              >
                {emWidth <= 10 && formatDate(date, 'DD.MM.YY')}
                {emWidth > 10 && emWidth <= 15 && formatDate(date, 'DD.MM.YY hh:mm A')}
                {emWidth > 15 && formatDate(date, 'ddd, MMM Do, YYYY hh:mm A')}
              </div>
            )}
            <div className={styles.heading}>
              <h2 className={styles.title}>{title}</h2>
              {status && (
                <div className={styles.status}>
                  {(typeof status === 'function' && status({layout: 'default'})) || status}
                </div>
              )}
            </div>
            {subtitle && (
              <h3 className={styles.subtitle}>
                {typeof subtitle === 'function' && subtitle({layout: 'card'})}
                {typeof subtitle === 'object' && subtitle}
                {typeof subtitle === 'string' &&
                  truncate(subtitle, {
                    length: 30,
                    separator: /,? +/
                  })}
              </h3>
            )}
            {description && (
              <p className={styles.description}>
                {typeof description === 'function' && description({layout: 'card'})}
                {typeof description === 'object' && description}
                {typeof description === 'string' &&
                  truncate(description, {
                    length: 100,
                    separator: /,? +/
                  })}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    )
  }
}
