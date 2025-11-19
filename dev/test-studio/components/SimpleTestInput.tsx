import {Card, Tab, TabList, TabPanel} from '@sanity/ui'
import {useState} from 'react'
import {type ObjectInputProps, useFormValue} from 'sanity'

export function SimpleTestInput(props: ObjectInputProps) {
  const [activeTab, setActiveTab] = useState<'title' | 'links'>('title')

  const links = useFormValue(['links']) as string | undefined

  const titleMembers = props.members
    .filter((member) => member.kind === 'field')
    .filter((member) => member.name === 'title')

  const linksMembers = props.members
    .filter((member) => member.kind === 'field')
    .filter((member) => member.name === 'links')

  return (
    <Card padding={0} radius={2}>
      <TabList space={2}>
        <Tab
          id="links-tab"
          aria-controls="links-panel"
          label={`Links ${links?.length ? `(${links?.length})` : '(0)'}`}
          selected={activeTab === 'links'}
          onClick={() => setActiveTab('links')}
        />
        <Tab
          id="title-tab"
          aria-controls="title-panel"
          label="Title"
          selected={activeTab === 'title'}
          onClick={() => setActiveTab('title')}
        />
      </TabList>

      <TabPanel id="medals-panel" aria-labelledby="medals-tab" hidden={activeTab !== 'title'}>
        <Card marginTop={5}>{props.renderDefault({...props, members: titleMembers})}</Card>
      </TabPanel>
      <TabPanel id="links-panel" aria-labelledby="links-tab" hidden={activeTab !== 'links'}>
        <Card marginTop={5}>{props.renderDefault({...props, members: linksMembers})}</Card>
      </TabPanel>
    </Card>
  )
}
