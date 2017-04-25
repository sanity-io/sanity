import PropTypes from 'prop-types'
import React from 'react'
import Moment from 'moment'
import {debounce, truncate} from 'lodash'
import styles from 'part:@sanity/components/previews/card-style'
import assetUrlBuilder from 'part:@sanity/base/asset-url-builder'
import SvgPlaceholder from './common/SvgPlaceholder'

let index = 0

export default class CardPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      date: PropTypes.object,
      media: PropTypes.element,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object,
      aspect: PropTypes.number
    }),
    assetSize: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
      fit: PropTypes.oneOf(['clip', 'crop', 'clamp'])
    }),
    aspect: PropTypes.number,
    emptyText: PropTypes.string,
    children: PropTypes.node,
    isPlaceholder: PropTypes.bool
  }

  static defaultProps = {
    assetSize: {width: 400},
    emptyText: 'Untitled',
    aspect: 16 / 9
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
    const {item, emptyText, children, aspect, isPlaceholder} = this.props
    const {emWidth} = this.state

    const containerAspect = aspect
    const imageAspect = this.state.aspect || (this.props.item && this.props.item.aspect) || 1


    if (!item || isPlaceholder) {
      return (
        <SvgPlaceholder styles={styles} />
      )
    }

    const {imageUrl, sanityImage, media} = item
    const assetUrl = assetUrlBuilder({...this.props.assetSize, url: imageUrl})

    return (
      <div className={`${styles.root}`}>
        <div className={styles.inner} ref={this.setInnerElement}>
          <div className={`${styles.mediaContainer}`}>
            {
              (!imageUrl && !sanityImage && !media) && (
                <div className={styles.media}>
                  <div style={{paddingTop: `${100 / containerAspect}%`}} />
                </div>
              )
            }
            {
              imageUrl && (
                <img src={assetUrl} className={imageAspect >= containerAspect ? styles.imgLandscape : styles.imgPortrait} />
              )
            }
            {
              sanityImage && (
                <div className={styles.sanityImage}>SanityImage</div>
              )
            }

            {
              media && (
                <div className={styles.media}>
                  {media}
                </div>
              )
            }
          </div>
          <div className={styles.meta} ref="meta">
            <div className={styles.heading}>
              {
                item.date
                && <p className={styles.date}>
                  {
                    emWidth <= 20 && Moment(item.date).format('L')
                  }
                  {
                    emWidth <= 30 && emWidth > 20 && Moment(item.date).format('LLL')
                  }
                  {
                    emWidth > 30 && Moment(item.date).format('LLLL')
                  }
                </p>
              }
              <h2 className={styles.title}>
                {item.title || emptyText}
              </h2>
              <h3 className={styles.subtitle}>
                {
                  truncate(item.subtitle, {
                    length: 30,
                    separator: /,? +/
                  })
                }
              </h3>
            </div>
            <p className={styles.description}>
              {
                truncate(item.description, {
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
