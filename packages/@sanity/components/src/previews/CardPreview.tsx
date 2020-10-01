/* eslint-disable complexity */

import formatDate from 'date-fns/format'
import elementResizeDetectorMaker from 'element-resize-detector'
import {debounce, truncate} from 'lodash'
import styles from 'part:@sanity/components/previews/card-style'
import React from 'react'
import {MediaDimensions} from '../types'

interface CardPreviewProps {
  title?: React.ReactNode | React.FC<unknown>
  subtitle?: React.ReactNode | React.FC<{layout: 'card'}>
  description?: React.ReactNode | React.FC<{layout: 'card'}>
  date?: Date
  status?: React.ReactNode | React.FC<{layout: 'default'}>
  media?: React.ReactNode | React.FC<{dimensions: MediaDimensions; layout: 'default'}>
  mediaDimensions?: MediaDimensions
  children?: React.ReactNode
  isPlaceholder?: boolean
}

const DEFAULT_MEDIA_DIMENSIONS: MediaDimensions = {
  width: 300,
  height: 225,
  aspect: 4 / 3,
  fit: 'crop'
}

let index = 0

const svgStyles: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%'
}

export default class CardPreview extends React.PureComponent<CardPreviewProps> {
  static defaultProps = {
    title: 'Untitled',
    subtitle: undefined,
    description: undefined,
    date: undefined,
    status: undefined,
    media: undefined,
    isPlaceholder: false,
    children: undefined
  }

  index = index++
  _elementResizeDetector = elementResizeDetectorMaker({strategy: 'scroll'})

  state = {
    emWidth: 10
  }

  dateElement: HTMLDivElement | null = null

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.isPlaceholder && this.dateElement) {
      this._elementResizeDetector.uninstall(this.dateElement)
    }

    if (!nextProps.isPlaceholder && this.dateElement) {
      this._elementResizeDetector.listenTo(this.dateElement, this.onResize)
    }
  }

  componentWillUnmount() {
    if (this.dateElement) this._elementResizeDetector.uninstall(this.dateElement)
  }

  setDateElement = (element: HTMLDivElement | null) => {
    this.dateElement = element
    if (element) {
      this._elementResizeDetector.listenTo(element, this.onResize)
    }
  }

  onResize = debounce(() => {
    const el = this.dateElement
    if (el) {
      const fontSize = Number(
        window
          .getComputedStyle(el, null)
          .getPropertyValue('font-size')
          .split('px')[0]
      )
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
      mediaDimensions = DEFAULT_MEDIA_DIMENSIONS,
      children,
      isPlaceholder,
      status
    } = this.props
    const {emWidth} = this.state
    const aspect = mediaDimensions.aspect || DEFAULT_MEDIA_DIMENSIONS.aspect!

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
                title={formatDate(date, 'ddd, MMM do, yyyy hh:mm a')}
              >
                {emWidth <= 10 && formatDate(date, 'DD.MM.YY')}
                {emWidth > 10 && emWidth <= 15 && formatDate(date, 'dd.MM.yy hh:mm a')}
                {emWidth > 15 && formatDate(date, 'ddd, MMM do, yyyy hh:mm a')}
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
