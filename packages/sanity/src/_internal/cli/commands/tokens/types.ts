export interface Token {
  id: string
  label: string
  projectUserId: string
  createdAt: string
  roles: TokenRole[]
}

export interface TokenRole {
  name: string
  title: string
}

export interface TokenResponse {
  id: string
  key: string
  roles: TokenRole[]
  label: string
  projectUserId: string
}

export interface ProjectRole {
  name: string
  title: string
  description: string
  isCustom: boolean
  projectId: string
  appliesToUsers: boolean
  appliesToRobots: boolean
}
