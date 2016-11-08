import React from 'react'
import {storiesOf, action, linkTo} from 'part:@sanity/storybook'
import Button from 'part:@sanity/components/buttons/default'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Chance from 'chance'
const chance = new Chance()

const style = {
  position: 'absolute',
  fontSize: '2em',
  zIndex: '-1'
}

const backgroundStuff = function (storyFn) {
  return (
    <div>
      <div style={style}>{chance.sentence(50)}</div>
      {storyFn()}
    </div>
  )
}

storiesOf('Dialogs')
.addDecorator(backgroundStuff)
.addWithInfo(
  'Default',
  '',
  () => {
    return (
      <div>
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <DefaultDialog title="This is the title" onClose={action('onClose')}>
          Put content here
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog, DefaultDialog.propTypes.actions],
    role: 'part:@sanity/components/dialogs/default'
  }
)
.addWithInfo(
  'Default (open)',
  '',
  () => {
    return (
      <div>
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <DefaultDialog title={chance.sentence()} isOpen onClose={action('onClose')}>
          This is the content
          {chance.paragraph()}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'part:@sanity/components/dialogs/default'
  }
)
.addWithInfo(
  'Default (with header)',
  '',
  () => {
    return (
      <div>
        <Button onClick={action('oh noes! I should not ble clickable!')}>Try click me</Button>
        <DefaultDialog title={chance.sentence()} isOpen onClose={action('onClose')} showHeader>
          This is the content
          {chance.paragraph()}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'part:@sanity/components/dialogs/default'
  }
)

.addWithInfo(
  'Fullscreen',
  '',
  () => {
    return (
      <div>
        <Button onClick={linkTo('Dialogs', 'Fullscreen (open)')}>Open fullscreen dialog</Button>
        <FullscreenDialog title="This is the title" onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)
.addWithInfo(
  'Fullscreen (open)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)

.addWithInfo(
  'Fullscreen (info)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog kind="info" title="This is the title" isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)


.addWithInfo(
  'Fullscreen (danger & centered)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog kind="danger" centered title="This is the title" isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)

.addWithInfo(
  'Fullscreen (danger)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog kind="danger" title="This is the title" isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)

.addWithInfo(
  'Fullscreen (success)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog kind="success" title="This is the title" isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)

.addWithInfo(
  'Fullscreen (warning)',
  '',
  () => {
    return (
      <div>
        <FullscreenDialog kind="warning" title="This is the title" isOpen onClose={action('onClose')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {
    propTables: [FullscreenDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
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
          {chance.paragraph({sentences: 50})}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
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
          {chance.paragraph({sentences: 50})}
        </DefaultDialog>
      </div>
    )
  },
  {
    propTables: [DefaultDialog],
    role: 'part:@sanity/components/dialogs/fullscreen'
  }
)
