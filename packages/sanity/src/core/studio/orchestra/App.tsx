import {Card, Flex, Spinner, studioTheme, Text, ThemeProvider} from '@sanity/ui'
import {Suspense} from 'react'

import {Orchestra} from './Orchestra'

// Loading fallback component
function Loading() {
  return (
    <Flex height="fill">
      <Card flex={1} height="fill" radius={4} overflow="hidden" shadow={[0, 0, 0, 1]}>
        <Flex align="center" height="fill" justify="center">
          <Text>
            <Spinner data-testid="application-loader" />
          </Text>
        </Flex>
      </Card>
    </Flex>
  )
}

export function App({
  localApplications,
}: {
  localApplications: Array<{port: number; title: string; remoteEntryUrl: string}>
}) {
  return (
    <ThemeProvider theme={studioTheme}>
      <Suspense fallback={<Loading />}>
        <Orchestra localApplications={localApplications} />
      </Suspense>
    </ThemeProvider>
  )
}
