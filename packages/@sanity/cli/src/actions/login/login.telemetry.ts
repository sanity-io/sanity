import {defineTrace} from '@sanity/telemetry'

interface SelectProviderStep {
  step: 'selectProvider'
  provider: string | undefined
}

interface WaitForTokenStep {
  step: 'waitForToken'
}

type LoginTraceData = SelectProviderStep | WaitForTokenStep

export const LoginTrace = defineTrace<LoginTraceData>({
  name: 'CLI Login Step Completed',
  version: 1,
  description: 'User completed a step in the CLI login flow',
})
