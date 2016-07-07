import React from 'react'
import Snackbar from 'component:@sanity/components/snackbar/default'
import {storiesOf, action} from 'component:@sanity/storybook'

storiesOf('Snackbar').addWithInfo(
  'Snackbar (info)',
  `
    Default snackbar.
    ### Role
    "component:@sanity/components/buttons/default"
  `,
  () => (
    <Snackbar>This is the message</Snackbar>
  ),
  {inline: true, propTables: [Snackbar]}
).addWithInfo(
  'Snackbar (warning)',
  `
    Default snackbar.
    ### Role
    "component:@sanity/components/buttons/default"
  `,
  () => (
    <Snackbar kind="warning">This is the message</Snackbar>
  ),
  {inline: true, propTables: [Snackbar]}
)
.addWithInfo(
  'Snackbar (success)',
  `
    Default snackbar.
    ### Role
    "component:@sanity/components/buttons/default"
  `,
  () => (
    <Snackbar kind="success">This is the success message</Snackbar>
  ),
  {inline: true, propTables: [Snackbar]}
)
.addWithInfo(
  'Snackbar (error)',
  `
    Default snackbar.
    ### Role
    "component:@sanity/components/buttons/default"
  `,
  () => (
    <Snackbar kind="error">This is the error message</Snackbar>
  ),
  {inline: true, propTables: [Snackbar]}
)
.addWithInfo(
  'Snackbar (with action)',
  `
    Default snackbar.
    ### Role
    "component:@sanity/components/buttons/default"
  `,
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
  {inline: true, propTables: [Snackbar]}
)
