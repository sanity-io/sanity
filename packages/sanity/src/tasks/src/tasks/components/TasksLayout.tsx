import {TabList} from '@sanity/ui'
import {Tab} from '../../../../ui-components'

export const TasksLayout = () => {
  const tabLabels = ['Assigned', 'Created', 'This document']

  return (
    <TabList space={1}>
      {tabLabels.map((label) => (
        <Tab key={label} aria-controls="preview-panel" id={`preview-tab-${label}`} label={label} />
      ))}
    </TabList>
  )
}
