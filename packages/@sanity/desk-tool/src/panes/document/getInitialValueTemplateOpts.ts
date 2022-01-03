import {getTemplatesBySchemaType, Template} from '@sanity/base/initial-value-templates'
import {Schema} from '@sanity/types'

interface InitialValueOptions {
  documentType: string
  panePayload?: unknown
  templateName?: string
  templateParams?: Record<string, unknown>
  urlTemplate?: string
}

/**
 * @internal
 */
export function getInitialValueTemplateOpts(
  schema: Schema,
  initialValueTemplates: Template[],
  opts: InitialValueOptions
): {templateName: string; templateParams: Record<string, unknown>} {
  const payload = opts.panePayload || {}
  const structureNodeTemplate = opts.templateName

  if (opts.urlTemplate && structureNodeTemplate && structureNodeTemplate !== opts.urlTemplate) {
    // eslint-disable-next-line no-console
    console.warn(
      `Conflicting templates: URL says "${opts.urlTemplate}", structure node says "${structureNodeTemplate}". Using "${structureNodeTemplate}".`
    )
  }

  const template = structureNodeTemplate || opts.urlTemplate
  const typeTemplates = getTemplatesBySchemaType(schema, initialValueTemplates, opts.documentType)

  const templateParams = {
    ...opts.templateParams,
    ...(typeof payload === 'object' ? payload || {} : {}),
  }

  let templateName = template

  // If we have not specified a specific template, and we only have a single
  // template available for a schema type, use it
  if (!template && typeTemplates.length === 1) {
    templateName = typeTemplates[0].id
  }

  return {templateName: templateName!, templateParams}
}
