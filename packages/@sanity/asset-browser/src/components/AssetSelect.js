import idx from 'idx'
import React, {useCallback, useContext, useEffect, useState} from 'react'
import dispatchContext from 'part:@sanity/asset-browser/context/dispatch'
import stateContext from 'part:@sanity/asset-browser/context/state'
import Button from 'part:@sanity/components/buttons/default'

import Asset from './Asset'
import styles from './styles/AssetSelect.css'

const PER_PAGE = 200

const AssetSelect = () => {
  const {onFetch} = useContext(dispatchContext)
  const {fetching, items, totalCount} = useContext(stateContext)

  const [pageIndex, setPageIndex] = useState(0)

  const fetchPage = index => {
    const start = index * PER_PAGE
    const end = start + PER_PAGE
    const orderDirection = 'desc'
    const sortField = '_updatedAt'

    const sort = `order(${sortField} ${orderDirection})`
    const selector = `[${start}...${end}]`

    onFetch({
      selector,
      sort
    })
  }

  // Fetch new page on mount and changes to `pageIndex`:
  useEffect(() => {
    fetchPage(pageIndex)
  }, [pageIndex])

  const hasMore = items.length < totalCount

  const handleFetchNextPage = useCallback(() => {
    setPageIndex(prevIndex => prevIndex + 1)
  }, [])

  return (
    <div className={styles.root}>
      <div className={styles.imageList}>
        {items &&
          items.map(item => {
            const assetId = idx(item, _ => _.asset._id)
            return <Asset item={item} key={assetId} />
          })}

        {!fetching && totalCount === 0 && <div className={styles.noAssets}>No images found</div>}
      </div>

      {hasMore && (
        <div className={styles.loadMore}>
          <Button onClick={handleFetchNextPage} loading={fetching}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}

export default AssetSelect
