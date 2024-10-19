import {type StudioManifest} from './manifestTypes'

export async function getStudioManifest(
  studioHostUrl: string,
): Promise<StudioManifest | undefined> {
  const url = `${studioHostUrl}/static/create-manifest.json`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {'Content-Type': 'application/json'},
    })

    if (response.status == 404) {
      return undefined
    }

    if (response.status > 299) {
      console.error(`Failed to get manifest from ${url}`, response)
      return undefined
    }

    return (await response.json()) as StudioManifest
  } catch (e) {
    console.error(`Failed to fetch from ${url}`, e)
    return undefined
  }
}
