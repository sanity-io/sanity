import {kebabCase} from 'lodash'
import {Serializable, SerializeOptions, SerializePath} from '../StructureNodes'
import {HELP_URL, SerializeError} from '../SerializeError'
import {validateId} from '../util/validateId'
import {ComponentViewBuilder} from './ComponentView'
import {FormViewBuilder} from './FormView'

export interface View {
  type: string
  id: string
  title: string
  icon?: React.ComponentType
}

export abstract class GenericViewBuilder<L extends Partial<View>, ConcreteImpl>
  implements Serializable
{
  protected spec: L = {} as L

  id(id: string): ConcreteImpl {
    return this.clone({id})
  }

  getId(): string | undefined {
    return this.spec.id
  }

  title(title: string): ConcreteImpl {
    return this.clone({title, id: this.spec.id || kebabCase(title)})
  }

  getTitle(): string | undefined {
    return this.spec.title
  }

  icon(icon: React.ComponentType): ConcreteImpl {
    return this.clone({icon})
  }

  getIcon(): React.ComponentType | undefined {
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

  clone(_withSpec?: Partial<View>): ConcreteImpl {
    return new (this.constructor as {new (): ConcreteImpl})()
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
