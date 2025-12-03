import {useMemo} from 'react'

import {isDev} from '../../../environment'
import {type ObjectMember} from '../../store/types/members'
import {type ObjectInputProps} from '../../types/inputProps'

export function useRenderMembers(
  schemaType: ObjectInputProps['schemaType'],
  members: ObjectMember[],
) {
  const renderedMembers = useMemo(() => {
    if (schemaType.renderMembers) {
      let newMembers: ObjectMember[] | undefined
      try {
        newMembers = schemaType.renderMembers(members)
      } catch (error) {
        // in development mode throw the error so the developer can see it right away.
        if (isDev) throw error

        // In production mode, we are going to log the error and return the original members to avoid breaking the app.
        console.error('Error rendering members, returning original members', error)
        newMembers = members
      }
      return newMembers
    }
    return members
  }, [members, schemaType])
  return renderedMembers
}
