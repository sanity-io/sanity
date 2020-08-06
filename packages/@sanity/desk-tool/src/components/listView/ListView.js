/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-filename-extension */

import PropTypes from 'prop-types'
import React from 'react'
import {List as GridList} from 'part:@sanity/components/lists/grid'
import styles from './ListView.css'

export default class ListView extends React.PureComponent {
  static propTypes = {
    layout: PropTypes.oneOf(['default', 'detail', 'card', 'media']),
    children: PropTypes.node
  }

  static defaultProps = {
    layout: 'default',
    children: undefined
  }

  render() {
    const {layout, children} = this.props
    if (layout === 'card') {
      return <GridList className={styles.cardList}>{children}</GridList>
    }

    if (layout === 'media') {
      return <GridList className={styles.mediaList}>{children}</GridList>
    }

    return children
  }
}
