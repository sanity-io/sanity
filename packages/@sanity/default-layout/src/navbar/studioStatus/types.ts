export type Severity = 'notice' | 'low' | 'medium' | 'high'

export interface Package {
  name: string
  latest: string
  severity: Severity
  version: string
}
