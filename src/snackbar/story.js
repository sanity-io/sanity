import React from 'react'
import Snackbar from 'component:@sanity/components/snackbar/default'
import {storiesOf, action} from 'component:@sanity/storybook'

require('../storybook-addons/role.js')

storiesOf('Snackbar')
.addWithRole(
  'Snackbar (info)',
  `
    Default snackbar.
  `,
  'component:@sanity/components/snackbar/default',
  () => (
    <Snackbar>This is the message</Snackbar>
  ),
  {propTables: [Snackbar]}
).addWithRole(
  'Snackbar (warning)',
  `
    Used to give a warning
  `,
  'component:@sanity/components/snackbar/default',
  () => (
    <Snackbar kind="warning">This is the message</Snackbar>
  ),
  {propTables: [Snackbar]}
)
.addWithRole(
  'Snackbar (success)',
  `
    Default snackbar.
  `,
  'component:@sanity/components/snackbar/default',
  () => (
    <Snackbar kind="success">This is the success message</Snackbar>
  ),
  {propTables: [Snackbar]}
)
.addWithRole(
  'Snackbar (error)',
  `
    Default snackbar.
  `,
  'component:@sanity/components/snackbar/default',
  () => (
    <Snackbar kind="error">This is the error message</Snackbar>
  ),
  {inline: true, propTables: [Snackbar]}
)
.addWithRole(
  'Snackbar (with action)',
  `
    Default snackbar.
  `,
  'component:@sanity/components/snackbar/default',
  () => {
    const myAction = {
      title: 'Undo',
      action: () => action('Action fired!')
    }
    return (
      <Snackbar action={myAction}>
        You published the document
      </Snackbar>
    )
  },
  {propTables: [Snackbar]}
)
