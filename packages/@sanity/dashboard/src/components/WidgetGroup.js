/* eslint-disable react/prop-types */

import React from 'react'
import WidgetContainer from 'part:@sanity/dashboard/widget-container'

import styles from './WidgetGroup.css'

function WidgetGroup(props) {
  const config = props.config || {}
  const widgets = config.widgets || []
  const layout = config.layout || {}
  return (
    <div
      className={styles.root}
      data-width={layout.width || 'auto'}
      data-height={layout.height || 'auto'}
    >
      {widgets.map((widgetConfig, index) => {
        if (widgetConfig.type === '__experimental_group') {
          return <WidgetGroup key={String(index)} config={widgetConfig} />
        }

        return <WidgetContainer key={String(index)} config={widgetConfig} />
      })}
    </div>
  )
}

export default WidgetGroup
