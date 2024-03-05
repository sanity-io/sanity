import {defineTrace} from '@sanity/telemetry'

interface StartStep {
  step: 'start'
  flags: Record<string, string | number | undefined | boolean>
}

interface LoginStep {
  step: 'login'
  alreadyLoggedIn?: boolean
}

interface FetchJourneyConfigStep {
  step: 'fetchJourneyConfig'
  projectId: string
  datasetName: string
  displayName: string
  isFirstProject: boolean
}

interface CreateOrSelectProjectStep {
  step: 'createOrSelectProject'
  projectId: string
  selectedOption: 'create' | 'select' | 'none'
}

interface CreateOrSelectDatasetStep {
  step: 'createOrSelectDataset'
  datasetName: string
  selectedOption: 'create' | 'select' | 'none'
  visibility: 'private' | 'public'
}

interface UseDefaultPlanCoupon {
  step: 'useDefaultPlanCoupon'
  selectedOption: 'yes' | 'no'
  coupon?: string
}

interface UseDefaultPlanId {
  step: 'useDefaultPlanId'
  selectedOption: 'yes' | 'no'
  planId?: string
}

interface UseDetectedFrameworkStep {
  step: 'useDetectedFramework'
  selectedOption: 'yes' | 'no'
  detectedFramework?: string
}

interface UseTypeScriptStep {
  step: 'useTypeScript'
  selectedOption: 'yes' | 'no'
}

interface SelectTemplateStep {
  step: 'selectProjectTemplate'
  selectedOption: string
}
interface ImportTemplateDatasetStep {
  step: 'importTemplateDataset'
  selectedOption: 'yes' | 'no'
}

interface SendCommunityInviteStep {
  step: 'sendCommunityInvite'
  selectedOption: 'yes' | 'no'
}

interface SelectPackageManagerStep {
  step: 'selectPackageManager'
  selectedOption: string
}

type InitStepResult =
  | StartStep
  | LoginStep
  | FetchJourneyConfigStep
  | CreateOrSelectProjectStep
  | CreateOrSelectDatasetStep
  | UseDetectedFrameworkStep
  | UseTypeScriptStep
  | ImportTemplateDatasetStep
  | SendCommunityInviteStep
  | SelectPackageManagerStep
  | SelectTemplateStep
  | UseDefaultPlanCoupon
  | UseDefaultPlanId

export const CLIInitStepCompleted = defineTrace<InitStepResult>({
  name: 'CLI Init Step Completed',
  version: 1,
  description: 'User completed a step in the CLI init flow',
})
