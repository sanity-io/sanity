import React from 'react'
import {storiesOf, action, linkTo} from 'component:@sanity/storybook'
import Button from 'component:@sanity/components/buttons/default'
import DefaultDialog from 'component:@sanity/components/dialogs/default'
import FullscreenDialog from 'component:@sanity/components/dialogs/fullscreen'
import Faker from 'Faker'

import centered from '../storybook-addons/centered.js'
import role from '../storybook-addons/role.js'


storiesOf('Dialogs')
.addDecorator(centered)
.addWithRole(
  'Default',
  '',
  'component:@sanity/components/dialogs/default',
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
  {propTables: [DefaultDialog, DefaultDialog.propTypes.actions]}
)
.addWithRole(
  'Default (open)',
  '',
  'component:@sanity/components/dialogs/default',
  () => {
    return (
      <div>
        <Button>Open default dialog</Button>
        <DefaultDialog title={Faker.Lorem.sentence()} isOpen onClose={linkTo('Dialogs', 'Default')}>
          This is the content
          {Faker.Lorem.paragraphs(2)}
        </DefaultDialog>
      </div>
    )
  },
  {propTables: [DefaultDialog]}
)
.addWithRole(
  'Fullscreen',
  '',
  'component:@sanity/components/dialogs/fullscreen',
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
  {propTables: [DefaultDialog]}
)
.addWithRole(
  'Fullscreen (open)',
  '',
  'component:@sanity/components/dialogs/fullscreen',
  () => {
    return (
      <div>
        <FullscreenDialog title="This is the title" isOpen onClose={linkTo('Dialogs', 'Fullscreen')}>
          This is the content
        </FullscreenDialog>
      </div>
    )
  },
  {propTables: [DefaultDialog]}
)
