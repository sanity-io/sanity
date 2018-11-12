import React from 'react'
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer'

export default function enhanceWithAvailHeight(Component) {
  function EnhancedWithAvailHeight(props) {
    return <AutoSizer>{sizeProps => <Component {...sizeProps} {...props} />}</AutoSizer>
  }

  EnhancedWithAvailHeight.displayName = `enhanceWithAvailHeight(${Component.displayName ||
    Component.name})`

  return EnhancedWithAvailHeight
}
