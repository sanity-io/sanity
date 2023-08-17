import type {ReferenceSchemaType, ReferenceTemplate, SanityDocument} from '@sanity/types'
import type {TemplatePermissionsResult} from '../../../store'
import type {CreateReferenceOption} from './types'

interface Options {
  schemaType: ReferenceSchemaType
  initialValueTemplateItems: TemplatePermissionsResult[] | undefined
  documentRef: {current: SanityDocument}
}

/**
 * @internal
 */
export function resolveCreateReferenceOptions(options: Options): CreateReferenceOption[] {
  const {schemaType, initialValueTemplateItems, documentRef} = options
  const specifiedTemplates = schemaType.options?.templates
  let allowedTemplates: ReferenceTemplate[] | undefined
  if (!specifiedTemplates) {
    console.log('no templates, using default')
    // User has not specified any specific templates to use, find all the templates
    // that match the schema types allowed by the reference field
    allowedTemplates = findCompatibleTemplates({schemaType, initialValueTemplateItems})
  } else if (Array.isArray(specifiedTemplates)) {
    console.log('array of templates. sick.')
    allowedTemplates = specifiedTemplates
  } else if (typeof specifiedTemplates === 'function') {
    // Matching the pattern used elsewhere in Sanity, where the first argument is the "previous"
    // value, in this case all the compatible templates. The user can choose to splat, or just
    // return a new array of templates
    const prev = findCompatibleTemplates({schemaType, initialValueTemplateItems})
    allowedTemplates = specifiedTemplates(prev, {document: documentRef.current})
    console.log('function!', allowedTemplates)
  } else {
    // @todo Move to schema validation machinery and assume it exists here?
    throw new Error('`templates` property must be an array or function')
  }

  const createItems: CreateReferenceOption[] = []
  for (const template of allowedTemplates) {
    const templateItem = initialValueTemplateItems?.find((item) => item.templateId === template.id)

    if (!templateItem) {
      continue
    }

    createItems.push(templateItemToReferenceOption(templateItem))
  }

  return createItems
}

function findCompatibleTemplates(options: {
  schemaType: ReferenceSchemaType
  initialValueTemplateItems?: TemplatePermissionsResult<Record<string, unknown>>[]
}): ReferenceTemplate[] {
  const {schemaType, initialValueTemplateItems} = options
  if (!initialValueTemplateItems || initialValueTemplateItems.length === 0) {
    return []
  }

  return (
    initialValueTemplateItems
      // Only include templates for types that are allowed by reference definition
      .filter((item) => schemaType.to.some((refType) => refType.name === item.template?.schemaType))
      .map((item) => ({id: item.templateId, params: item.parameters}))
  )
}

function templateItemToReferenceOption(
  item: TemplatePermissionsResult<Record<string, unknown>>,
): CreateReferenceOption {
  return {
    id: item.id,
    title: item.title || `${item.template.schemaType} from template ${item.template.id}`,
    type: item.template.schemaType,
    icon: item.icon,
    template: {
      id: item.template.id,
      params: item.parameters,
    },

    permission: {granted: item.granted, reason: item.reason},
  }
}
