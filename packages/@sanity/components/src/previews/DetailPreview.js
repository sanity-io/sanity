import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/detail-style'
import TextEllipsis from 'react-text-ellipsis'
import SvgPlaceholder from './common/SvgPlaceholder'

let index = 0
const fieldProp = PropTypes.oneOfType([PropTypes.string, PropTypes.node, PropTypes.func])

export default class DetailPreview extends React.PureComponent {
  static propTypes = {
    title: fieldProp,
    subtitle: fieldProp,
    description: fieldProp,
    status: fieldProp,
    media: fieldProp,
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
    subtitle: 'No subtitle…',
    description: 'No description…',
    media: undefined,
    status: undefined,
    children: undefined,
    isPlaceholder: false,
    mediaDimensions: {width: 120, height: 120, fit: 'crop', aspect: 1}
  }

  index = index++

  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions,
      media,
      status,
      children,
      isPlaceholder
    } = this.props

    if (isPlaceholder) {
      return (
        <div className={styles.root}>
          <SvgPlaceholder styles={styles} />
        </div>
      )
    }

    return (
      <div className={styles.root}>
        {
          media && (
            <div className={styles.media}>
              {
                typeof media === 'function' && (
                  media({dimensions: mediaDimensions, layout: 'default'})
                  || <div className={styles.noMedia} />
                )
              }
              {
                typeof media !== 'function' && media
              }
            </div>
          )
        }
        <div className={styles.content}>
          <div className={styles.top}>
            <div className={styles.heading}>
              <h2 className={styles.title}>
                {
                  (typeof title === 'function' && title({layout: 'detail'}))
                  || title
                }
              </h2>
              {
                subtitle && (
                  <h3 className={styles.subtitle}>
                    {
                      (typeof subtitle === 'function' && subtitle({layout: 'detail'}))
                      || subtitle
                    }
                  </h3>
                )
              }
            </div>
            {
              status && (
                <div className={status}>
                  {
                    (typeof status === 'function' && status({layout: 'detail'}))
                    || status
                  }
                </div>
              )
            }
          </div>
          {
            description && (
              <p className={styles.description}>
                {
                  typeof description === 'function' && description({layout: 'detail'})
                }
                {
                  typeof description === 'string' && (
                    <TextEllipsis
                      lines={2}
                      tag={'span'}
                      ellipsisChars={'…'}
                      tagClass={'className'}
                      debounceTimeoutOnResize={200}
                      useJsOnly
                    >
                      {description}
                    </TextEllipsis>
                  )
                }
                {
                  typeof description === 'object' && description
                }
              </p>
            )
          }
        </div>
        {children}
      </div>
    )
  }
}
