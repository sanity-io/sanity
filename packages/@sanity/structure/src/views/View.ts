import {kebabCase} from 'lodash'
import {Serializable, SerializeOptions, SerializePath} from '../StructureNodes'
import {SerializeError} from '..'
import {HELP_URL} from '../SerializeError'
import {validateId} from '../util/validateId'

export interface View {
  type: string
  id: string
  title: string
  icon?: Function
}

export class ViewBuilder implements Serializable {
  protected spec: Partial<View>

  constructor(spec?: Partial<View>) {
    this.spec = spec || {}
  }

  id(id: string) {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title, id: this.spec.id || kebabCase(title)})
  }

  getTitle() {
    return this.spec.title
  }

  icon(icon: Function) {
    return this.clone({icon})
  }

  getIcon() {
    return this.spec.icon
  }

  serialize(options: SerializeOptions = {path: []}): View {
    const {id, title, icon} = this.spec
    if (!id) {
      throw new SerializeError(
        '`id` is required for view item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.ID_REQUIRED)
    }

    if (!title) {
      throw new SerializeError(
        '`title` is required for view item',
        options.path,
        options.index
      ).withHelpUrl(HELP_URL.TITLE_REQUIRED)
    }

    return {
      id: validateId(id, options.path, options.index),
      title,
      icon,
      type: 'view'
    }
  }

  clone(withSpec?: Partial<View>) {
    const builder = new ViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}

function isBuilder(view: View | ViewBuilder): view is ViewBuilder {
  return typeof (view as ViewBuilder).serialize === 'function'
}

export function maybeSerializeView(
  item: View | ViewBuilder,
  index: number,
  path: SerializePath
): View {
  return isBuilder(item) ? item.serialize({path, index}) : item
}
