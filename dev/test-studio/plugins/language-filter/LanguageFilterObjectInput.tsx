import {pathFor} from '@sanity/util/paths'
import {
  type FieldMember,
  type FieldSetMember,
  ObjectInput,
  type ObjectInputProps,
  type ObjectMember,
  useFormBuilder,
} from 'sanity'

import {_isPathCollapsed} from './_helpers'
import {type LanguageFilterPluginOptions} from './types'
import {usePaneLanguages} from './usePaneLanguages'

export function LanguageFilterObjectInput(
  props: {options: LanguageFilterPluginOptions} & ObjectInputProps,
) {
  const {members: membersProp, level, options, path, ...restProps} = props
  const {collapsedFieldSets} = useFormBuilder()
  const {selectedLanguages} = usePaneLanguages({options})
  const translationsFieldSetPath = pathFor(path.concat(['translationsFieldSet']))
  const translationsFieldSetCollapsed = _isPathCollapsed(
    translationsFieldSetPath,
    collapsedFieldSets,
  )

  const defaultMembers = membersProp.filter(
    (member) => member.kind === 'field' && options.defaultLanguages?.includes(member.name),
  )
  const translationsFieldSetMembers = membersProp.filter(
    (member): member is FieldMember =>
      member.kind === 'field' &&
      selectedLanguages.includes(member.name) &&
      !options.defaultLanguages?.includes(member.name),
  )

  const members: ObjectMember[] =
    translationsFieldSetMembers.length === 0
      ? defaultMembers
      : [
          ...defaultMembers,
          {
            kind: 'fieldSet',
            key: 'translationsFieldSet',
            fieldSet: {
              path: translationsFieldSetPath,
              name: 'translations',
              level: level + 1,
              title: 'Translations',
              collapsible: true,
              collapsed: translationsFieldSetCollapsed ?? true,
              members: translationsFieldSetMembers,
            },
          } as FieldSetMember,
        ]

  return <ObjectInput {...restProps} level={level} members={members} path={path} />
}
