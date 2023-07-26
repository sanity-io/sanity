export function getValidationInspectorName(deskConfigName = 'desk'): string {
  const configName = deskConfigName === 'desk' ? '' : `/${deskConfigName}`
  return `sanity/desk${configName}/validation`
}
