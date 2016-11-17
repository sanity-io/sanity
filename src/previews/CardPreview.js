import React, {PropTypes} from 'react'
import styles from 'part:@sanity/components/previews/card-style'
import Moment from 'moment'
import {debounce, truncate} from 'lodash'

export default class CardPreview extends React.Component {
  static propTypes = {
    item: PropTypes.shape({
      title: PropTypes.string,
      subtitle: PropTypes.string,
      description: PropTypes.string,
      date: PropTypes.object,
      media: PropTypes.node,
      imageUrl: PropTypes.string,
      sanityImage: PropTypes.object
    }),
    emptyText: PropTypes.string,
    children: PropTypes.node
  }

  static defaultProps = {
    emptyText: 'Untitled',
  }

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
    const {item, emptyText, children} = this.props
    const {emWidth} = this.state

    if (!item) {
      return (
        <div className={`${styles.empty}`}>
          {emptyText}
        </div>
      )
    }

    return (
      <div className={`${styles.root}`}>
        <div className={styles.inner} ref={this.setInnerElement}>
          {
            item.imageUrl && <img src={item.imageUrl} className={styles.media} />
          }
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
