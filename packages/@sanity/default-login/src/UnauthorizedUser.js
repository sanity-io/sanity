import PropTypes from 'prop-types'
import React from 'react'
import userStore from 'part:@sanity/base/user'
import {Dialog, Box, Text, Button, Stack} from '@sanity/ui'

function handleLogout() {
  userStore.actions.logout()
}

export default function UnauthorizedUser(props) {
  return (
    <Dialog
      header="Unauthorized"
      width={1}
      cardShadow={2}
      footer={
        <Box padding={3}>
          <Button text="Logout" onClick={handleLogout} style={{width: '100%'}} />
        </Box>
      }
    >
      <Box paddingX={4} paddingY={5}>
        <Stack space={4}>
          <Text>
            You are not authorized to access this studio. Maybe you could ask someone to invite you
            to collaborate on this project?
          </Text>
          <Text>
            If you think this is an error, verify that you are logged in with the correct account.
            You are currently logged in as{' '}
            <span>
              {props.user.name} ({props.user.email})
            </span>
          </Text>
        </Stack>
      </Box>
    </Dialog>
  )
}

UnauthorizedUser.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }),
}
