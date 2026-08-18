import {type BaseView, type FormView} from 'sanity'

import {type SerializeOptions} from '../StructureNodes'
import {GenericViewBuilder} from './View'

export {type FormView}

/**
 * Class for building a form view.
 *
 * @public */
export class FormViewBuilder extends GenericViewBuilder<Partial<BaseView>, FormViewBuilder> {
  /** Document list options. See {@link FormView} */
  protected spec: Partial<FormView>

  constructor(spec?: Partial<FormView>) {
    super()
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  /**
   * Serialize Form view builder
   * @param options - Serialize options. See {@link SerializeOptions}
   * @returns form view builder based on path provided in options. See {@link FormView}
   */
  serialize(options: SerializeOptions = {path: []}): FormView {
    return {
      ...super.serialize(options),
      type: 'form',
    }
  }

  /**
   * Clone Form view builder (allows for options overriding)
   * @param withSpec - Partial form view builder options. See {@link FormView}
   * @returns form view builder. See {@link FormViewBuilder}
   */
  clone(withSpec?: Partial<FormView>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...withSpec}
    return builder
  }
}
