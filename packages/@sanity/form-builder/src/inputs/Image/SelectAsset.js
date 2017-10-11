// @flow
import React from 'react'
import client from 'part:@sanity/base/client'
import {List as GridList, Item as GridListItem} from 'part:@sanity/components/lists/grid'
import Button from 'part:@sanity/components/buttons/default'
import styles from './SelectAsset.css'
import {get} from 'lodash'

const PER_PAGE = 200

type Asset = {
  _id: string,
  url: string
}
type State = {
  assets: Array<Asset>,
  isLastPage: boolean
}
type Props = {
  onSelect: Asset => void
}
export default class SelectAsset extends React.Component<Props, State> {

  state = {
    assets: [],
    isLastPage: false
  }

  pageNo: number
  pageNo = 0

  fetchPage(pageNo: number) {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    const slice = `${start}...${end}`
    return client.fetch(`*[_type == "sanity.imageAsset"][${slice}] {_id, url, metadata {dimensions}}`).then(result => {
      this.setState(prevState => ({
        isLastPage: result.length === 0,
        assets: prevState.assets.concat(result)
      }))
    })
  }

  componentDidMount() {
    this.fetchPage(this.pageNo)
  }

  handleSelectItem = (event: SyntheticEvent<*>) => {
    const assetId = event.currentTarget.getAttribute('data-id')
    const selected = this.state.assets.find(doc => doc._id === assetId)
    if (selected) {
      this.props.onSelect(selected)
    }
  }
  handleFetchNextPage = () => {
    this.fetchPage(++this.pageNo)
  }

  render() {
    const {assets, isLastPage} = this.state
    return (
      <div className={styles.root}>
        <div className={styles.imageList}>
          {assets.map(asset => {
            const size = 75
            const width = get(asset, 'metadata.dimensions.width') || 100
            const height = get(asset, 'metadata.dimensions.height') || 100
            return (
              <div
                key={asset._id}
                className={styles.item}
                data-id={asset._id}
                onClick={this.handleSelectItem}
                style={{width: `${(width * size) / height}px`, flexGrow: `${(width * size) / height}`}}
              >
                <i className={styles.padder} style={{paddingBottom: `${(height / width) * 100}%`}} />
                <img src={`${asset.url}?w=100`} className={styles.image} />
              </div>
            )
          })}
        </div>
        <div className={styles.loadMore}>
          {
            isLastPage
              ? <span>Nothing more to load…</span>
              : <Button onClick={this.handleFetchNextPage}>Load more…</Button>
          }
        </div>
      </div>
    )
  }
}
