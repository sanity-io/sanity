import PropTypes from 'prop-types'
import React from 'react'
import styles from 'part:@sanity/components/previews/detail-style'
import {truncate} from 'lodash'
import SvgPlaceholder from './common/SvgPlaceholder'

let index = 0

export default class DetailPreview extends React.PureComponent {
  static propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    description: PropTypes.string,
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
    title: undefined,
    subtitle: undefined,
    description: undefined,
    renderMedia: undefined,
    children: undefined,
    isPlaceholder: false,
    mediaDimensions: {width: 80, height: 80, fit: 'crop', aspect: 1}
  }

  index = index++

  render() {
    const {
      title,
      subtitle,
      description,
      mediaDimensions,
      renderMedia,
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
        <div className={styles.media}>
          {renderMedia(mediaDimensions)}
        </div>
        <div className={styles.content}>
          <div className={styles.heading}>
            <h2 className={styles.title}>
              {title}
            </h2>
            {
              subtitle && (
                <h3 className={styles.subtitle}>
                  {subtitle}
                </h3>
              )
            }
          </div>
          {
            description && (
              <p className={styles.description}>
                {
                  truncate(description, {
                    length: 70,
                    separator: /,? +/
                  })
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
