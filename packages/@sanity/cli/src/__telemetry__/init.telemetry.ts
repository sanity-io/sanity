import {defineTrace} from '@sanity/telemetry'

interface StartStep {
  step: 'start'
  flags: Record<string, string | number | undefined | boolean>
}

interface LoginStep {
  step: 'login'
  alreadyLoggedIn?: boolean
}

interface CreateOrSelectProjectStep {
  step: 'createOrSelectProject'
  projectId: string
  selectedOption: 'create' | 'select' | 'none'
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
  | CreateOrSelectProjectStep
  | CreateOrSelectDatasetStep
  | UseDetectedFrameworkStep
  | UseTypeScriptStep
  | ImportTemplateDatasetStep
  | SendCommunityInviteStep
  | SelectPackageManagerStep
  | SelectTemplateStep

export const CLIInitStepCompleted = defineTrace<InitStepResult>({
  name: 'CLI Init Step Completed',
  version: 1,
  description: 'User completed a step in the CLI init flow',
})
