import {getTemplateById} from '@sanity/initial-value-templates'
import {camelCase, pickBy} from 'lodash'
import {getPlusIcon} from './parts/Icon'
import {StructureNode, SerializeOptions, Serializable, Child, SerializePath} from './StructureNodes'
import {Layout, layoutOptions} from './Layout'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {IntentChecker, Intent, IntentParams, defaultIntentChecker} from './Intent'
import {SerializeError} from './SerializeError'
import {
  InitialValueTemplateItem,
  InitialValueTemplateItemBuilder,
  maybeSerializeInitialValueTemplateItem,
} from './InitialValueTemplateItem'
import {validateId} from './util/validateId'

function noChildResolver() {
  return undefined
}

export const shallowIntentChecker: IntentChecker = (intentName, params, {pane, index}): boolean => {
  return index <= 1 && defaultIntentChecker(intentName, params, {pane, index})
}

export interface ListDisplayOptions {
  showIcons?: boolean
}

export interface BaseGenericList extends StructureNode {
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  displayOptions?: ListDisplayOptions
  child: Child
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
}

// "POJO"/verbatim-version - end result
export interface GenericList extends BaseGenericList {
  type: string
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
}

// Used internally in builder classes to make everything optional
export interface BuildableGenericList extends Partial<BaseGenericList> {
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

// Input version, allows builders and only requires things not inferrable
export interface GenericListInput extends StructureNode {
  id: string
  title: string
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
  defaultLayout?: Layout
  canHandleIntent?: IntentChecker
  child?: Child
}

export abstract class GenericListBuilder<L extends BuildableGenericList, ConcreteImpl>
  implements Serializable {
  protected initialValueTemplatesSpecified = false
  protected spec: L = {} as L

  id(id: string) {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle() {
    return this.spec.title
  }

  defaultLayout(defaultLayout: Layout) {
    return this.clone({defaultLayout})
  }

  getDefaultLayout() {
    return this.spec.defaultLayout
  }

  menuItems(menuItems: (MenuItem | MenuItemBuilder)[]) {
    return this.clone({menuItems})
  }

  getMenuItems() {
    return this.spec.menuItems
  }

  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]) {
    return this.clone({menuItemGroups})
  }

  getMenuItemGroups() {
    return this.spec.menuItemGroups
  }

  child(child: Child) {
    return this.clone({child})
  }

  getChild() {
    return this.spec.child
  }

  canHandleIntent(canHandleIntent: IntentChecker) {
    return this.clone({canHandleIntent})
  }

  getCanHandleIntent() {
    return this.spec.canHandleIntent
  }

  showIcons(enabled: boolean) {
    return this.clone({
      displayOptions: {...(this.spec.displayOptions || {}), showIcons: enabled},
    })
  }

  getShowIcons() {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcons : undefined
  }

  initialValueTemplates(templates: InitialValueTemplateItem | InitialValueTemplateItem[]) {
    this.initialValueTemplatesSpecified = true
    return this.clone({initialValueTemplates: Array.isArray(templates) ? templates : [templates]})
  }

  getInitialValueTemplates() {
    return this.spec.initialValueTemplates
  }

  serialize(options: SerializeOptions = {path: []}): GenericList {
    const id = this.spec.id || ''
    const path = options.path

    const defaultLayout = this.spec.defaultLayout
    if (defaultLayout && !layoutOptions.includes(defaultLayout)) {
      throw new SerializeError(
        `\`layout\` must be one of ${layoutOptions.map((item) => `"${item}"`).join(', ')}`,
        path,
        id || options.index,
        this.spec.title
      )
    }

    const initialValueTemplates = (this.spec.initialValueTemplates || []).map((item, i) =>
      maybeSerializeInitialValueTemplateItem(item, i, path)
    )

    return {
      id: validateId(id, options.path, id || options.index),
      title: this.spec.title,
      type: 'genericList',
      defaultLayout,
      child: this.spec.child || noChildResolver,
      canHandleIntent: this.spec.canHandleIntent || shallowIntentChecker,
      displayOptions: this.spec.displayOptions,
      initialValueTemplates,
      menuItems: menuItemsWithCreateIntents(this.spec, {path, initialValueTemplates}),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, path)
      ),
    }
  }

  clone(withSpec?: object) {
    const builder = new (this.constructor as {new (): ConcreteImpl})()
    return builder
  }
}

function menuItemsWithCreateIntents(
  list: BuildableGenericList,
  options: {path: SerializePath; initialValueTemplates?: InitialValueTemplateItem[]}
): MenuItem[] {
  const {path, initialValueTemplates = []} = options
  const items = (list.menuItems || []).map((item, i) => maybeSerializeMenuItem(item, i, path))
  const hasCreate = items.some((menuItem) => menuItem.intent && menuItem.intent.type === 'create')
  const hasTemplates = initialValueTemplates.length > 0
  if (hasCreate || !hasTemplates) {
    return items
  }

  const PlusIcon = getPlusIcon()

  const loneTemplate =
    initialValueTemplates.length === 1 &&
    maybeSerializeInitialValueTemplateItem(initialValueTemplates[0], 0, path)

  const actionButton = new MenuItemBuilder()
    .title('Create new')
    .icon(PlusIcon)
    .showAsAction({whenCollapsed: true})

  if (loneTemplate) {
    // If we have a single create item, link to that template directly.
    // Otherwise we'll want to select from a menu

    // Action button
    const template = getTemplateById(loneTemplate.templateId)
    const templateTitle = template && template.title
    items.unshift(
      actionButton
        .title(`Create new ${loneTemplate.title || templateTitle || ''}`)
        .intent(getCreateIntent(loneTemplate))
        .serialize()
    )
  } else {
    // More than one item, so we'll want that dropdown of choices
    items.unshift(actionButton.action('toggleTemplateSelectionMenu').serialize())
  }

  return items
}

function getCreateIntent(templateItem: InitialValueTemplateItem): Intent {
  const tpl = getTemplateById(templateItem.templateId)
  const params = pickBy({type: tpl && tpl.schemaType, template: templateItem.templateId}, Boolean)
  const intentParams: IntentParams = templateItem.parameters
    ? [params, templateItem.parameters]
    : params

  return {
    type: 'create',
    params: intentParams,
  }
}
