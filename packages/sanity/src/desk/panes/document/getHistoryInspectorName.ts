export function getHistoryInspectorName(deskConfigName = 'desk'): string {
  const configName = deskConfigName === 'desk' ? '' : `/${deskConfigName}`
  return `sanity/desk${configName}/history`
}
