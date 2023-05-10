const LOCAL_STORAGE_PREFIX = 'sanity-language'

export function getPreferredLang(projectId: string, sourceId: string): string | undefined {
  if (!hasLocalStorage) {
    return undefined
  }
  const language = localStorage.getItem(itemId(projectId, sourceId))
  return language ?? undefined
}

export function storePreferredLang(projectId: string, sourceId: string, lang: string): void {
  if (!hasLocalStorage) {
    return
  }
  localStorage.setItem(itemId(projectId, sourceId), lang)
}

function itemId(projectId: string, workspaceId: string) {
  return [LOCAL_STORAGE_PREFIX, projectId, workspaceId].join(':')
}

function hasLocalStorage() {
  return typeof localStorage !== 'undefined'
}
