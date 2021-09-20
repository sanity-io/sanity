import * as React from 'react'
import {Card, Box, Text, Code} from '@sanity/ui'

type Props = {error: Error; isAuthError: false} | {isAuthError: true}

export function LoadError(props: Props) {
  return (
    <Card tone="critical" radius={1}>
      <Box as="header" paddingX={4} paddingTop={4} paddingBottom={1}>
        <Text as="h2" weight="bold">
          Google Maps failed to load
        </Text>
      </Box>

      <Box paddingX={4} paddingTop={4} paddingBottom={1}>
        {props.isAuthError ? (
          <AuthError />
        ) : (
          <>
            <Text as="h3">Error details:</Text>
            <pre>
              <Code size={1}>{props.error?.message}</Code>
            </pre>
          </>
        )}
      </Box>
    </Card>
  )
}

function AuthError() {
  return (
    <Text>
      <p>The error appears to be related to authentication</p>
      <p>Common causes include:</p>
      <ul>
        <li>Incorrect API key</li>
        <li>Referer not allowed</li>
        <li>Missing authentication scope</li>
      </ul>
      <p>Check the browser developer tools for more information.</p>
    </Text>
  )
}
