import {type SanityDocument} from '@sanity/client'
import {useMemo, useState} from 'react'
import {MentionUserContext} from 'sanity/_singletons'

import {useUserListWithPermissions} from '../../../hooks'

/**
 * @internal
 */
export function MentionUserProvider(props: {children: React.ReactNode}) {
  const [selectedDocument, setSelectedDocument] = useState<SanityDocument | null>(null)
  const mentionOptions = useUserListWithPermissions({
    documentValue: selectedDocument,
    permission: 'read',
  })

  const value = useMemo(
    () => ({
      mentionOptions,
      selectedDocument,
      setSelectedDocument,
    }),
    [mentionOptions, selectedDocument, setSelectedDocument],
  )

  return <MentionUserContext.Provider value={value}>{props.children}</MentionUserContext.Provider>
}
