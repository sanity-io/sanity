import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Button from 'component:@sanity/components/buttons/default'
import DefaultDialog from 'component:@sanity/components/dialogs/default'
import FullscreenDialog from 'component:@sanity/components/dialogs/fullscreen'
import faker from 'faker'

storiesOf('Dialogs')
.addWithInfo(
  'Default',
  '',
  () => {
    return (
      <div>
        <Button onClick={linkTo('Dialogs', 'Default (open)')}>Open default dialog</Button>
        <DefaultDialog title="This is the title" onClose={linkTo('Default (open)')}>
          Put content here
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog, DefaultDialog.propTypes.actions],
    role: 'component:@sanity/components/dialogs/default'
  }
)
.addWithInfo(
  'Default (open)',
  '',
  () => {
    return (
      <div>
        <Button>Open default dialog</Button>
        <DefaultDialog title={faker.lorem.sentence()} isOpen onClose={linkTo('Dialogs', 'Default')}>
          This is the content
          {faker.lorem.paragraphs(2)}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/default'
  }
)
.addWithInfo(
  'Default (with header)',
  '',
  () => {
    return (
      <div>
        <Button>Open default dialog</Button>
        <DefaultDialog title={faker.lorem.sentence()} isOpen onClose={linkTo('Dialogs', 'Default')} showHeader>
          This is the content
          {faker.lorem.paragraphs(2)}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/default'
  }
)

.addWithInfo(
  'Fullscreen',
  '',
  () => {
    return (
      <div>
        <Button onClick={linkTo('Dialogs', 'Fullscreen (open)')}>Open fullscreen dialog</Button>
        <FullscreenDialog title="This is the title" onClose={linkTo('dialogClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/fullscreen'
  }
)
.addWithInfo(
  'Fullscreen (open)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog title="This is the title" isOpen onClose={linkTo('Dialogs', 'Fullscreen')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/fullscreen'
  }
)

.addWithInfo(
  'Default (with actions)',
  '',
  () => {
    const actions = [
      {
        index: '1',
        title: 'Finish'
      },
      {
        index: '2',
        title: 'Cancel',
      },
      {
        index: '3',
        title: 'Secondary',
        kind: 'secondary'
      }
    ]
    return (
      <div>
        <DefaultDialog
          title="This is the title"
          isOpen onClose={linkTo('Dialogs', 'Fullscreen')}
          actions={actions}
          onAction={action('onAction')}
        >
          This is the content
          {faker.lorem.paragraphs(50)}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/fullscreen'
  }
)
.addWithInfo(
  'Default (with actions nad header)',
  '',
  () => {
    const actions = [
      {
        index: '1',
        title: 'Finish'
      },
      {
        index: '2',
        title: 'Cancel',
      },
      {
        index: '3',
        title: 'Secondary',
        kind: 'secondary'
      }
    ]
    return (
      <div>
        <DefaultDialog
          title="This is the title"
          isOpen onClose={linkTo('Dialogs', 'Fullscreen')}
          showHeader
          actions={actions}
          onAction={action('onAction')}
        >
          This is the content
          {faker.lorem.paragraphs(50)}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'component:@sanity/components/dialogs/fullscreen'
  }
)
