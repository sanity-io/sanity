import {Intent} from './Intent'
import {Partial} from './Partial'
import {SortItem} from './Sort'

type ShowAsAction = {
  whenCollapsed: boolean
}

export interface MenuItem {
  title: string
  action?: string | Function
  intent?: Intent
  group?: string
  icon?: Function
  params?: object
  showAsAction?: boolean | ShowAsAction
}

export type PartialMenuItem = Partial<MenuItem>

export class MenuItemBuilder {
  protected spec: PartialMenuItem = {}

  constructor(spec: PartialMenuItem = {}) {
    this.spec = spec
  }

  action(action: string | Function): MenuItemBuilder {
    this.spec.action = action
    return this
  }

  intent(intent: Intent): MenuItemBuilder {
    this.spec.intent = intent
    return this
  }

  title(title: string): MenuItemBuilder {
    this.spec.title = title
    return this
  }

  group(group: string): MenuItemBuilder {
    this.spec.group = group
    return this
  }

  icon(icon: Function): MenuItemBuilder {
    this.spec.icon = icon
    return this
  }

  params(params: object): MenuItemBuilder {
    this.spec.params = params
    return this
  }

  showAsAction(asAction: boolean | ShowAsAction): MenuItemBuilder {
    this.spec.showAsAction = asAction
    return this
  }

  serialize(): MenuItem {
    const {title, action, intent} = this.spec
    if (!title) {
      throw new Error('`title` is required for menu item')
    }

    if (!action && !intent) {
      throw new Error(
        `\`action\` or \`intent\` required for menu item with title ${this.spec.title}`
      )
    }

    if (intent && action) {
      throw new Error('cannot set both `action` AND `intent`')
    }

    return {...this.spec, title}
  }
}

export interface SortMenuItem extends MenuItem {
  params: {
    by: SortItem[]
  }
}
