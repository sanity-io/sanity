import {useEffect} from 'react'

const JAM_TEAM_ID = 'b2966e7d-27e8-402f-80a4-fb20a69590ad'

/**
 * Injects the Jam site scripts into the document head so that
 * console logs, network requests, and custom metadata are captured
 * when a Jam recording is created from this page.
 *
 * 1. `<meta name="jam:team">` — identifies the team
 * 2. `recorder.js` — enables screen recording from the page
 * 3. `capture.js` — captures console logs, network requests, and custom metadata
 *
 * @internal
 */
export function useJamScripts(): void {
  useEffect(() => {
    if (document.head.querySelector('meta[name="jam:team"]')) return

    const meta = document.createElement('meta')
    meta.name = 'jam:team'
    meta.content = JAM_TEAM_ID
    document.head.appendChild(meta)

    const recorder = document.createElement('script')
    recorder.type = 'module'
    recorder.src = 'https://js.jam.dev/recorder.js'
    document.head.appendChild(recorder)

    const capture = document.createElement('script')
    capture.type = 'module'
    capture.src = 'https://js.jam.dev/capture.js'
    document.head.appendChild(capture)
  }, [])
}
