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
  icon?: React.ComponentType | React.ReactNode
}

export abstract class GenericViewBuilder<TView extends Partial<View>, ConcreteImpl>
  implements Serializable<View>
{
  protected spec: TView = {} as TView

  id(id: string): ConcreteImpl {
    return this.clone({id})
  }

  getId(): TView['id'] {
    return this.spec.id
  }

  title(title: string): ConcreteImpl {
    return this.clone({title, id: this.spec.id || kebabCase(title)})
  }

  getTitle(): TView['title'] {
    return this.spec.title
  }

  icon(icon: React.ComponentType | React.ReactNode): ConcreteImpl {
    return this.clone({icon})
  }

  getIcon(): TView['icon'] {
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

  abstract clone(withSpec?: Partial<View>): ConcreteImpl
}

function isSerializable(view: View | Serializable<View>): view is Serializable<View> {
  return typeof (view as Serializable<View>).serialize === 'function'
}

export function maybeSerializeView(
  item: View | Serializable<View>,
  index: number,
  path: SerializePath
): View {
  return isSerializable(item) ? item.serialize({path, index}) : item
}

export type ViewBuilder = ComponentViewBuilder | FormViewBuilder
