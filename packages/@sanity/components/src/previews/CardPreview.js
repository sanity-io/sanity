import PropTypes from 'prop-types'
import React from 'react'
import formatDate from 'date-fns/format'
import {debounce, truncate} from 'lodash'
import styles from 'part:@sanity/components/previews/card-style'
import SvgPlaceholder from './common/SvgPlaceholder'

let index = 0

export default class CardPreview extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
    date: PropTypes.object,
    renderMedia: PropTypes.func,
    mediaDimensions: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp']),
      aspect: PropTypes.number,
    }),
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    title: 'Untitled…',
    mediaDimensions: {width: 160, height: 160, aspect: 16 / 9, fit: 'crop'}
  }

  index = index++

  constructor(props, context) {
    super(props, context)
    this.state = {
      emWidth: 10
    }
  }

  onResize = debounce(() => {
    const el = this.inner
    if (el) {
      const fontSize = window.getComputedStyle(el, null).getPropertyValue('font-size').split('px')[0]
      const emWidth = el.offsetWidth / fontSize
      this.setState({
        emWidth: emWidth
      })
    }
  }, 1000 / 60)

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
    this.onResize()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  setInnerElement = inner => {
    this.inner = inner
  }

  render() {
    const {
      title,
      subtitle,
      description,
      date,
      renderMedia,
      mediaDimensions,
      children,
      isPlaceholder
    } = this.props
    const {emWidth} = this.state

    if (isPlaceholder) {
      return (
        <SvgPlaceholder styles={styles} />
      )
    }

    return (
      <div className={`${styles.root}`}>
        <div className={styles.inner} ref={this.setInnerElement}>
          <div className={`${styles.mediaContainer}`}>
            {
              renderMedia && (
                <div className={styles.media}>
                  {renderMedia(mediaDimensions)}
                </div>
              )
            }
          </div>
          <div className={styles.meta}>
            <div className={styles.heading}>
              {
                date && (
                  <p className={styles.date}>
                    {
                      emWidth <= 20 && formatDate(date, 'DD.MM.YY')
                    }
                    {
                      emWidth <= 30 && emWidth > 20 && formatDate(date, 'DD.MM.YY hh:mm A')
                    }
                    {
                      emWidth > 30 && formatDate(date, 'ddd, MMM Do, YYYY hh:mm A')
                    }
                  </p>
                )
              }
              <h2 className={styles.title}>
                {title}
              </h2>
              <h3 className={styles.subtitle}>
                {
                  truncate(subtitle, {
                    length: 30,
                    separator: /,? +/
                  })
                }
              </h3>
            </div>
            <p className={styles.description}>
              {
                truncate(description, {
                  length: 100,
                  separator: /,? +/
                })
              }
            </p>
            {children}
          </div>
        </div>
      </div>
    )
  }
}
