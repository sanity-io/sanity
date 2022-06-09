export interface Invite {
  email: string
  role: string
  createdAt: string
  isAccepted: boolean
  isRevoked: boolean
  acceptedByUserId: string | null
}

export interface User {
  id: string
  projectId: string
  provider: string

  displayName: string
  familyName: string | null
  givenName: string | null
  middleName: string | null

  imageUrl: string | null

  createdAt: string
  updatedAt: string | null
}

export interface MemberRole {
  name: string
  title: string
  description?: string
}

export interface Member {
  id: string
  isCurrentUser: boolean
  isRobot: boolean
  role: string

  createdAt: string
  updatedAt: string | null
}

export interface PartialProjectResponse {
  members: Member[]
}

export interface Role {
  name: string
  title: string
  description?: string
  isCustom: boolean
  projectId: string
  appliesToUsers: boolean
  appliesToRobots: boolean
  grants: Record<string, Grant[] | undefined>
}

export interface Grant {
  id: string
  name: string
  title: string
  description?: string
  isCustom: boolean
  grants: unknown[]
}
