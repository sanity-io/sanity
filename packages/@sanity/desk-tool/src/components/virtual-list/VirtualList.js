import React, {Component} from 'react'
import Grid from 'react-virtualized/dist/commonjs/Grid'
import enhanceWithAvailHeight from './enhanceWithAvailHeight'

const COL_MIN_WIDTH = 175

const getColumnCountForLayout = (layout, availWidth) => {
  switch (layout) {
    case 'detail':
    case 'default':
      return 1
    default: {
      return Math.max(1, Math.floor(availWidth / COL_MIN_WIDTH))
    }
  }
}

const getRowHeightForLayout = layout => {
  switch (layout) {
    case 'detail':
      return 96
    case 'default':
      return 56
    case 'card':
      return 300
    default: {
      return 56
    }
  }
}

export default enhanceWithAvailHeight(
  class VirtualList extends Component {
    cellRenderer = ({columnIndex, key, rowIndex, isScrolling, style}) => {
      const {renderItem, items, width} = this.props
      const columnCount = Math.floor(width / COL_MIN_WIDTH)

      const index = rowIndex * columnCount + columnIndex
      const item = items[index]
      return item ? (
        <div key={key} style={style}>
          {renderItem(item, index)}
        </div>
      ) : null
    }
    rowRenderer = ({index, isScrolling, key, style}) => {
      const {renderItem, items} = this.props
      const item = items[index]
      if (!item) {
        return null
      }
      return (
        <div key={key} style={style}>
          {renderItem(item, index)}
        </div>
      )
    }

    render() {
      const {items, width, height, layout, selectedItemId} = this.props

      const columnCount = getColumnCountForLayout(layout, width)
      const remainder = width - columnCount * COL_MIN_WIDTH
      const selectedItemIndex = items.findIndex(item => item._id === selectedItemId)
      const selectedItemRow = Math.floor(selectedItemIndex / columnCount)
      const scrollToColumn = selectedItemIndex % columnCount
      return (
        <Grid
          cellRenderer={this.cellRenderer}
          rowRenderer={this.rowRenderer}
          height={height}
          width={width}
          overscanColumnCount={10}
          overscanRowCount={10}
          rowHeight={getRowHeightForLayout(layout)}
          columnWidth={Math.ceil(COL_MIN_WIDTH + remainder / columnCount)}
          columnCount={columnCount}
          rowCount={Math.ceil(items.length / columnCount)}
          scrollToColumn={scrollToColumn}
          scrollToRow={selectedItemRow}
        />
      )
    }
  }
)
