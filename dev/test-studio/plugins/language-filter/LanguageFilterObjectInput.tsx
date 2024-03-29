import {pathFor} from '@sanity/util/paths'
import {useMemo} from 'react'
import {
  type FieldError,
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

  const defaultMembers = useMemo(
    () =>
      membersProp.filter(
        (member) => member.kind === 'field' && options.defaultLanguages?.includes(member.name),
      ),
    [membersProp, options],
  )

  const members: ObjectMember[] = useMemo(() => {
    const translationsFieldSetMembers = membersProp
      .filter(
        (member) =>
          member.kind === 'field' &&
          selectedLanguages.includes(member.name) &&
          !options.defaultLanguages?.includes(member.name),
      )
      .map((member): FieldMember | FieldError => {
        if (member.kind === 'fieldSet') {
          return {
            kind: 'error',
            key: member.key,
            fieldName: member.fieldSet.name,
            error: new Error('test') as any, // @todo
          }
        }

        return member
      })

    if (translationsFieldSetMembers.length === 0) {
      return defaultMembers
    }

    const translationsFieldSet: FieldSetMember = {
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
    }

    return defaultMembers.concat([translationsFieldSet])
  }, [
    defaultMembers,
    translationsFieldSetCollapsed,
    level,
    membersProp,
    options,
    selectedLanguages,
    translationsFieldSetPath,
  ])

  return <ObjectInput {...restProps} level={level} members={members} path={path} />
}
