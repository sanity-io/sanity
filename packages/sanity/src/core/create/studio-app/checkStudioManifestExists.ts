export async function checkStudioManifestExists(studioHostUrl: string): Promise<boolean> {
  const url = `${studioHostUrl}/static/create-manifest.json`
  try {
    const response = await fetch(url, {
      method: 'HEAD',
    })

    if (response.status == 404) {
      return false
    }

    if (response.status > 299) {
      console.error(`Failed to get manifest from ${url}`, response)
      return false
    }

    return true
  } catch (e) {
    console.error(`Failed to fetch from ${url}`, e)
    return false
  }
}
