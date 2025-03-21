const appTemplates = ['app-quickstart']

/**
 * Determine if a given template is a studio template.
 * This function may need to be more robust once we
 * introduce remote templates, for example.
 *
 * @param templateName - Name of the template
 * @returns boolean indicating if the template is a studio template
 */
export function determineAppTemplate(templateName: string): boolean {
  return appTemplates.includes(templateName)
}
