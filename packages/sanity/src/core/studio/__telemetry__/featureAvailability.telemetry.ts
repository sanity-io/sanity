// Fires once per workspace mount. Group by envelope `activeWorkspace` and
// `activeProjectId` for per-workspace adoption; raw counts skew to heavy users.
import {defineEvent} from '@sanity/telemetry'

interface WorkspaceFeaturesObservedInfo {
  advancedVersionControlEnabled: boolean
}

export const WorkspaceFeaturesObserved = defineEvent<WorkspaceFeaturesObservedInfo>({
  name: 'Workspace Features Observed',
  version: 1,
  description: 'Feature flags enabled for the current workspace',
})
