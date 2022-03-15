import {useRouter} from '@sanity/state-router'
import {Card, Flex, Spinner} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useAuth} from '../auth'
import {useSource} from '../source'
import {LoginScreen} from './screens/login/LoginScreen'
import {NotFoundScreen} from './screens/NotFoundScreen'
import {NoToolsScreen} from './screens/NoToolsScreen'
import {SchemaErrorsScreen} from './screens/schemaErrors'
import {ToolScreen} from './screens/ToolScreen'
import {useStudio} from './useStudio'

export function Studio() {
  const {tools} = useStudio()
  const source = useSource()
  const auth = useAuth()
  const {state: routerState} = useRouter()

  const schemaValidationProblemGroups = source.schema._validation
  const schemaErrors = useMemo(
    () =>
      schemaValidationProblemGroups?.filter(
        (msg) => !!msg.problems.find((p) => p.severity === 'error')
      ),
    [schemaValidationProblemGroups]
  )

  if (schemaValidationProblemGroups && schemaErrors && schemaErrors.length > 0) {
    return <SchemaErrorsScreen problemGroups={schemaValidationProblemGroups} />
  }

  if (!auth.loaded) {
    return (
      <Card height="fill">
        <Flex align="center" height="fill" justify="center">
          <Spinner muted />
        </Flex>
      </Card>
    )
  }

  if (!auth.user) {
    return <LoginScreen />
  }

  if (tools.length === 0) {
    return <NoToolsScreen />
  }

  if (routerState.isNotFound) {
    return <NotFoundScreen />
  }

  return <ToolScreen />
}
