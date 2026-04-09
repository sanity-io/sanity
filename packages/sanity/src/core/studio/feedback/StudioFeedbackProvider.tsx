import {type ReactNode, useMemo} from 'react'
import {FeedbackContext, type FeedbackContextValue} from 'sanity/_singletons'

import {useStudioFeedbackTags} from '../../feedback/hooks/useStudioFeedbackTags'
import {useTelemetryConsent} from '../telemetry/useTelemetryConsent'

/** @internal */
export function StudioFeedbackProvider({children}: {children: ReactNode}) {
  const {allTags, userName, userEmail} = useStudioFeedbackTags()
  const telemetryConsent = useTelemetryConsent()

  const value = useMemo<FeedbackContextValue>(
    () => ({telemetryConsent, userName, userEmail, tags: allTags}),
    [telemetryConsent, userName, userEmail, allTags],
  )

  return <FeedbackContext.Provider value={value}>{children}</FeedbackContext.Provider>
}
