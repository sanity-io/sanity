// @flow
import React from 'react'
import client from 'part:@sanity/base/client'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/SelectAsset.css'
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

function createQuery(start = 0, end = PER_PAGE) {
  return `*[_type == "sanity.imageAsset"] | order(_updatedAt desc) [${start}...${end}] {_id,url,metadata {dimensions}}`
}

export default class SelectAsset extends React.Component<Props, State> {
  state = {
    assets: [],
    isLastPage: false,
    isLoading: false
  }

  pageNo: number
  pageNo = 0

  fetchPage(pageNo: number) {
    const start = pageNo * PER_PAGE
    const end = start + PER_PAGE
    this.setState({isLoading: true})
    return client.fetch(createQuery(start, end)).then(result => {
      this.setState(prevState => ({
        isLastPage: result.length === 0,
        assets: prevState.assets.concat(result),
        isLoading: false
      }))
    })
  }

  componentDidMount() {
    this.fetchPage(this.pageNo)
  }

  select(id) {
    const selected = this.state.assets.find(doc => doc._id === id)
    if (selected) {
      this.props.onSelect(selected)
    }
  }

  handleItemClick = (event: SyntheticEvent<*>) => {
    event.preventDefault()
    this.select(event.currentTarget.getAttribute('data-id'))
  }

  handleItemKeyPress = (event: SyntheticEvent<*>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      this.select(event.currentTarget.getAttribute('data-id'))
    }
  }
  handleFetchNextPage = () => {
    this.fetchPage(++this.pageNo)
  }

  render() {
    const {assets, isLastPage, isLoading} = this.state
    return (
      <div className={styles.root}>
        <div className={styles.imageList}>
          {assets.map(asset => {
            const size = 75
            const width = get(asset, 'metadata.dimensions.width') || 100
            const height = get(asset, 'metadata.dimensions.height') || 100
            return (
              <a
                key={asset._id}
                className={styles.item}
                data-id={asset._id}
                onClick={this.handleItemClick}
                onKeyPress={this.handleItemKeyPress}
                tabIndex={0}
                style={{
                  width: `${(width * size) / height}px`,
                  flexGrow: `${(width * size) / height}`
                }}
              >
                <i
                  className={styles.padder}
                  style={{paddingBottom: `${(height / width) * 100}%`}}
                />
                <img src={`${asset.url}?h=100`} className={styles.image} />
              </a>
            )
          })}
        </div>
        <div className={styles.loadMore}>
          {!isLastPage && (
            <Button onClick={this.handleFetchNextPage} loading={isLoading}>
              Load more
            </Button>
          )}
        </div>
      </div>
    )
  }
}
