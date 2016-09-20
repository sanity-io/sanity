import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'

storiesOf('Snackbar')
.addWithInfo(
  'Snackbar (info)',
  `
    Default snackbar.
  `,
  () => (
    <Snackbar>This is the message</Snackbar>
  ),
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
).addWithInfo(
  'Snackbar (warning)',
  `
    Used to give a warning
  `,
  () => (
    <Snackbar kind="warning">This is the message</Snackbar>
  ),
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
.addWithInfo(
  'Snackbar (success)',
  `
    Default snackbar.
  `,
  () => (
    <Snackbar kind="success">This is the success message</Snackbar>
  ),
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
.addWithInfo(
  'Snackbar (error)',
  `
    Default snackbar.
  `,
  () => (
    <Snackbar kind="error">This is the error message</Snackbar>
  ),
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
.addWithInfo(
  'Snackbar (with action)',
  `
    Default snackbar.
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
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
