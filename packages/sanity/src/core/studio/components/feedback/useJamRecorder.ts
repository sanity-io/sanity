import {useCallback, useRef} from 'react'

const JAM_TEAM_ID = 'b2966e7d-27e8-402f-80a4-fb20a69590ad'

/**
 * Lazily loads the Jam Recording Links SDK and provides a function
 * to open the in-page Jam capture overlay for a given recording ID.
 *
 * @internal
 */
export function useJamRecorder(): {openRecorder: (recordingId: string) => Promise<void>} {
  const sdkRef = useRef<typeof import('@jam.dev/recording-links/sdk') | null>(null)
  const initializedRef = useRef(false)
  const recorderRef = useRef<Awaited<
    ReturnType<typeof import('@jam.dev/recording-links/sdk').loadRecorder>
  > | null>(null)

  const openRecorder = useCallback(async (recordingId: string) => {
    if (!sdkRef.current) {
      sdkRef.current = await import('@jam.dev/recording-links/sdk')
    }

    const jam = sdkRef.current

    if (!initializedRef.current) {
      jam.initialize({teamId: JAM_TEAM_ID, openImmediately: false})
      initializedRef.current = true
    }

    if (!recorderRef.current) {
      recorderRef.current = await jam.loadRecorder({teamId: JAM_TEAM_ID, openImmediately: false})
    }

    recorderRef.current.open(recordingId)
  }, [])

  return {openRecorder}
}
