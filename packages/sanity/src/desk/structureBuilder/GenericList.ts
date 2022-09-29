import {camelCase} from 'lodash'
import {Child, Serializable, SerializeOptions, StructureNode} from './StructureNodes'
import {layoutOptions} from './Layout'
import {MenuItem, MenuItemBuilder, maybeSerializeMenuItem} from './MenuItem'
import {MenuItemGroup, MenuItemGroupBuilder, maybeSerializeMenuItemGroup} from './MenuItemGroup'
import {IntentChecker, defaultIntentChecker} from './Intent'
import {SerializeError} from './SerializeError'
import {
  InitialValueTemplateItemBuilder,
  maybeSerializeInitialValueTemplateItem,
} from './InitialValueTemplateItem'
import {validateId} from './util/validateId'
import {PreviewLayoutKey, InitialValueTemplateItem} from 'sanity'

function noChildResolver() {
  return undefined
}

/** @internal */
export const shallowIntentChecker: IntentChecker = (intentName, params, {pane, index}): boolean => {
  return index <= 1 && defaultIntentChecker(intentName, params, {pane, index})
}

/** @beta */
export interface ListDisplayOptions {
  showIcons?: boolean
}

/** @beta */
export interface BaseGenericList extends StructureNode {
  defaultLayout?: PreviewLayoutKey
  canHandleIntent?: IntentChecker
  displayOptions?: ListDisplayOptions
  child: Child
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
}

/** @beta */
// "POJO"/verbatim-version - end result
export interface GenericList extends BaseGenericList {
  type: string
  menuItems: MenuItem[]
  menuItemGroups: MenuItemGroup[]
}

/** @beta */
// Used internally in builder classes to make everything optional
export interface BuildableGenericList extends Partial<BaseGenericList> {
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
}

/** @beta */
// Input version, allows builders and only requires things not inferrable
export interface GenericListInput extends StructureNode {
  id: string
  title: string
  menuItems?: (MenuItem | MenuItemBuilder)[]
  menuItemGroups?: (MenuItemGroup | MenuItemGroupBuilder)[]
  initialValueTemplates?: (InitialValueTemplateItem | InitialValueTemplateItemBuilder)[]
  defaultLayout?: PreviewLayoutKey
  canHandleIntent?: IntentChecker
  child?: Child
}

/** @beta */
export abstract class GenericListBuilder<TList extends BuildableGenericList, ConcreteImpl>
  implements Serializable<GenericList>
{
  protected initialValueTemplatesSpecified = false
  protected spec: TList = {} as TList

  id(id: string): ConcreteImpl {
    return this.clone({id})
  }

  getId(): TList['id'] {
    return this.spec.id
  }

  title(title: string): ConcreteImpl {
    return this.clone({title, id: this.spec.id || camelCase(title)})
  }

  getTitle(): TList['title'] {
    return this.spec.title
  }

  defaultLayout(defaultLayout: PreviewLayoutKey): ConcreteImpl {
    return this.clone({defaultLayout})
  }

  getDefaultLayout(): TList['defaultLayout'] {
    return this.spec.defaultLayout
  }

  menuItems(menuItems: (MenuItem | MenuItemBuilder)[] | undefined): ConcreteImpl {
    return this.clone({menuItems})
  }

  getMenuItems(): TList['menuItems'] {
    return this.spec.menuItems
  }

  menuItemGroups(menuItemGroups: (MenuItemGroup | MenuItemGroupBuilder)[]): ConcreteImpl {
    return this.clone({menuItemGroups})
  }

  getMenuItemGroups(): TList['menuItemGroups'] {
    return this.spec.menuItemGroups
  }

  child(child: Child): ConcreteImpl {
    return this.clone({child})
  }

  getChild(): TList['child'] {
    return this.spec.child
  }

  canHandleIntent(canHandleIntent: IntentChecker): ConcreteImpl {
    return this.clone({canHandleIntent})
  }

  getCanHandleIntent(): TList['canHandleIntent'] {
    return this.spec.canHandleIntent
  }

  showIcons(enabled = true): ConcreteImpl {
    return this.clone({
      displayOptions: {...(this.spec.displayOptions || {}), showIcons: enabled},
    })
  }

  getShowIcons(): boolean | undefined {
    return this.spec.displayOptions ? this.spec.displayOptions.showIcons : undefined
  }

  initialValueTemplates(
    templates:
      | InitialValueTemplateItem
      | InitialValueTemplateItemBuilder
      | Array<InitialValueTemplateItem | InitialValueTemplateItemBuilder>
  ): ConcreteImpl {
    this.initialValueTemplatesSpecified = true
    return this.clone({initialValueTemplates: Array.isArray(templates) ? templates : [templates]})
  }

  getInitialValueTemplates(): TList['initialValueTemplates'] {
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
      menuItems: (this.spec.menuItems || []).map((item, i) =>
        maybeSerializeMenuItem(item, i, path)
      ),
      menuItemGroups: (this.spec.menuItemGroups || []).map((item, i) =>
        maybeSerializeMenuItemGroup(item, i, path)
      ),
    }
  }

  abstract clone(_withSpec?: object): ConcreteImpl
}
