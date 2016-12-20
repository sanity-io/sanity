import React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {storiesOf, action} from 'part:@sanity/storybook'

storiesOf('Snackbar')
.addWithInfo(
  'Info',
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
  'Wwarning',
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
  'Success',
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
  'Error',
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
  'With action',
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

.addWithInfo(
  'Danger with action',
  `
    Default snackbar.
  `,
  () => {
    const myAction = {
      title: 'Revert',
      action: () => action('Action fired!')
    }
    return (
      <Snackbar kind="danger" action={myAction} time={10000}>
        You deleted <strong>Name of something</strong>
      </Snackbar>
    )
  },
  {
    propTables: [Snackbar],
    role: 'part:@sanity/components/snackbar/default'
  }
)
