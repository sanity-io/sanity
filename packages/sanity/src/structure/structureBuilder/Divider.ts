import {uniqueId} from 'lodash'
import {type I18nTextRecord} from 'sanity'

import {type Divider, type Serializable} from './StructureNodes'

export class DividerBuilder implements Serializable<Divider> {
  protected spec: Divider

  constructor(spec?: Divider) {
    this.spec = {
      id: uniqueId('__divider__'),
      type: 'divider',
      ...spec,
    }
  }

  /** Set the title of the divider
   * @param title - the title of the divider
   * @returns divider builder based on title provided
   */
  title(title: string): DividerBuilder {
    return this.clone({
      title,
    })
  }

  /** Get the title of the divider
   * @returns the title of the divider
   */
  getTitle(): Divider['title'] {
    return this.spec.title
  }

  /** Set the i18n key and namespace used to populate the localized title.
   * @param i18n - the key and namespaced used to populate the localized title.
   * @returns divider builder based on i18n key and ns provided
   */
  i18n(i18n: I18nTextRecord<'title'>): DividerBuilder {
    return this.clone({
      i18n,
    })
  }

  /** Get i18n key and namespace used to populate the localized title
   * @returns the i18n key and namespace used to populate the localized title
   */
  getI18n(): I18nTextRecord<'title'> | undefined {
    return this.spec.i18n
  }

  /** Serialize the divider
   * @returns the serialized divider
   */
  serialize(): Divider {
    return {...this.spec}
  }

  /** Clone divider builder (allows for options overriding)
   * @param withSpec - divider builder options
   * @returns cloned builder
   */
  clone(withSpec?: Partial<Divider>): DividerBuilder {
    const builder = new DividerBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
