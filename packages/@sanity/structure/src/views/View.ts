import {kebabCase} from 'lodash'
import {Serializable, SerializeOptions, SerializePath} from '../StructureNodes'
import {SerializeError} from '..'
import {HELP_URL} from '../SerializeError'
import {validateId} from '../util/validateId'
import {FixMe} from '../types'
import {ComponentViewBuilder} from './ComponentView'
import {FormViewBuilder} from './FormView'

export interface View {
  type: string
  id: string
  title: string
  icon?: FixMe
}

export abstract class GenericViewBuilder<L extends Partial<View>, ConcreteImpl>
  implements Serializable {
  protected spec: L = {} as L

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

  icon(icon: FixMe) {
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
      type: 'view',
    }
  }

  clone(withSpec?: Partial<View>) {
    const builder = new (this.constructor as {new (): ConcreteImpl})()
    return builder
  }
}

function isSerializable(view: View | Serializable): view is Serializable {
  return typeof (view as Serializable).serialize === 'function'
}

export function maybeSerializeView(
  item: View | Serializable,
  index: number,
  path: SerializePath
): View {
  return isSerializable(item) ? (item.serialize({path, index}) as View) : item
}

export type ViewBuilder = ComponentViewBuilder | FormViewBuilder
