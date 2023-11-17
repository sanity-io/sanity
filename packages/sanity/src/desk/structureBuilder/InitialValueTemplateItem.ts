import {pickBy} from 'lodash'
import {AddIcon} from '@sanity/icons'
import {HELP_URL, SerializeError} from './SerializeError'
import {Serializable, SerializeOptions, SerializePath} from './StructureNodes'
import {MenuItemBuilder, MenuItem} from './MenuItem'
import {IntentParams} from './Intent'
import {StructureContext} from './types'
import {InitialValueTemplateItem} from 'sanity'

/**
 * A `InitialValueTemplateItemBuilder` is used to build a document node with an initial value set.
 *
 * @public
 */
export class InitialValueTemplateItemBuilder implements Serializable<InitialValueTemplateItem> {
  /** Initial Value template item option object. See {@link InitialValueTemplateItem} */
  protected spec: Partial<InitialValueTemplateItem>

  constructor(
    /**
     * Desk structure context. See {@link StructureContext}
     */
    protected _context: StructureContext,
    spec?: Partial<InitialValueTemplateItem>,
  ) {
    this.spec = spec ? spec : {}
  }

  /** Set initial value template item builder ID
   * @param id - initial value template item ID
   * @returns initial value template item based on ID provided. See {@link InitialValueTemplateItemBuilder}
   */
  id(id: string): InitialValueTemplateItemBuilder {
    return this.clone({id})
  }

  /** Get initial value template item builder ID
   * @returns initial value template item ID. See {@link InitialValueTemplateItem}
   */
  getId(): Partial<InitialValueTemplateItem>['id'] {
    return this.spec.id
  }

  /** Set initial value template item title
   * @param title - initial value template item title
   * @returns initial value template item based on title provided. See {@link InitialValueTemplateItemBuilder}
   */
  title(title: string): InitialValueTemplateItemBuilder {
    return this.clone({title})
  }

  /** Get initial value template item title
   * @returns initial value template item title. See {@link InitialValueTemplateItem}
   */
  getTitle(): Partial<InitialValueTemplateItem>['title'] {
    return this.spec.title
  }

  /** Set initial value template item description
   * @param description - initial value template item description
   * @returns initial value template item builder based on description provided. See {@link InitialValueTemplateItemBuilder}
   */
  description(description: string): InitialValueTemplateItemBuilder {
    return this.clone({description})
  }

  /** Get initial value template item description
   * @returns initial value template item description. See {@link InitialValueTemplateItem}
   */
  getDescription(): Partial<InitialValueTemplateItem>['description'] {
    return this.spec.description
  }

  /** Set initial value template ID
   * @param templateId - initial value template item template ID
   * @returns initial value template item based builder on template ID provided. See {@link InitialValueTemplateItemBuilder}
   */
  templateId(templateId: string): InitialValueTemplateItemBuilder {
    // Let's try to be a bit helpful and assign an ID from template ID if none is specified
    const paneId = this.spec.id || templateId
    return this.clone({
      id: paneId,
      templateId,
    })
  }

  /** Get initial value template item template ID
   * @returns initial value template item ID. See {@link InitialValueTemplateItem}
   */
  getTemplateId(): Partial<InitialValueTemplateItem>['templateId'] {
    return this.spec.templateId
  }

  /** Get initial value template item template parameters
   * @param parameters - initial value template item parameters
   * @returns initial value template item builder based on parameters provided. See {@link InitialValueTemplateItemBuilder}
   */
  parameters(parameters: {[key: string]: any}): InitialValueTemplateItemBuilder {
    return this.clone({parameters})
  }

  /** Get initial value template item template parameters
   * @returns initial value template item parameters. See {@link InitialValueTemplateItem}
   */
  getParameters(): Partial<InitialValueTemplateItem>['parameters'] {
    return this.spec.parameters
  }

  /** Serialize initial value template item
   * @param options - serialization options. See {@link SerializeOptions}
   * @returns initial value template item object based on the path, index and hint provided in options. See {@link InitialValueTemplateItem}
   */
  serialize({path = [], index, hint}: SerializeOptions = {path: []}): InitialValueTemplateItem {
    const {spec, _context} = this
    const {templates} = _context

    if (typeof spec.id !== 'string' || !spec.id) {
      throw new SerializeError(
        '`id` is required for initial value template item nodes',
        path,
        index,
        hint,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!spec.templateId) {
      throw new SerializeError(
        'template id (`templateId`) is required for initial value template item nodes',
        path,
        spec.id,
        hint,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    const template = templates.find((t) => t.id === spec.templateId)

    if (!template) {
      throw new SerializeError(
        'template id (`templateId`) is required for initial value template item nodes',
        path,
        spec.id,
        hint,
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    return {
      id: spec.id,
      templateId: spec.id,
      schemaType: template.schemaType,
      type: 'initialValueTemplateItem',
      description: spec.description || template.description,
      title: spec.title || template.title,
      subtitle: spec.subtitle,
      icon: spec.icon || template.icon,
      initialDocumentId: spec.initialDocumentId,
      parameters: spec.parameters,
    }
  }

  /** Clone generic view builder (allows for options overriding)
   * @param withSpec - initial value template item builder options. See {@link InitialValueTemplateItemBuilder}
   * @returns initial value template item builder based on the context and options provided. See {@link InitialValueTemplateItemBuilder}
   */
  clone(withSpec: Partial<InitialValueTemplateItem> = {}): InitialValueTemplateItemBuilder {
    const builder = new InitialValueTemplateItemBuilder(this._context)
    builder.spec = {...this.spec, ...withSpec}
    return builder
  }
}

/** @internal */
export function defaultInitialValueTemplateItems(
  context: StructureContext,
): InitialValueTemplateItemBuilder[] {
  const {schema, getStructureBuilder, templates} = context

  // Sort templates by their schema type, in order or definition
  const typeNames = schema.getTypeNames()
  const ordered = templates
    // Don't list templates that require parameters
    // TODO: this should use the new-document template items instead maybe?
    .filter((tpl) => !tpl.parameters?.length)
    .sort((a, b) => typeNames.indexOf(a.schemaType) - typeNames.indexOf(b.schemaType))

  // Create actual template items out of the templates
  return ordered.map((tpl) => getStructureBuilder().initialValueTemplateItem(tpl.id))
}

/** @internal */
export function maybeSerializeInitialValueTemplateItem(
  item: InitialValueTemplateItem | InitialValueTemplateItemBuilder,
  index: number,
  path: SerializePath,
): InitialValueTemplateItem {
  return item instanceof InitialValueTemplateItemBuilder ? item.serialize({path, index}) : item
}

/** @internal */
export function menuItemsFromInitialValueTemplateItems(
  context: StructureContext,
  templateItems: InitialValueTemplateItem[],
): MenuItem[] {
  const {schema, templates} = context
  return templateItems.map((item) => {
    const template = templates.find((t) => t.id === item.templateId)
    const title = item.title || template?.title || 'Create new'
    const params = pickBy(
      {type: template && template.schemaType, template: item.templateId},
      Boolean,
    )
    const intentParams: IntentParams = item.parameters ? [params, item.parameters] : params
    const schemaType = template && schema.get(template.schemaType)

    return new MenuItemBuilder(context)
      .title(title)
      .icon((template && template.icon) || schemaType?.icon || AddIcon)
      .intent({type: 'create', params: intentParams})
      .serialize()
  })
}
