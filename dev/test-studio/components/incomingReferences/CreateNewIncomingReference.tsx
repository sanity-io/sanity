import {uuid} from '@sanity/uuid'
import {useCallback, useMemo} from 'react'
import {
  CreateReferenceButton,
  type CreateReferenceOption,
  getPublishedId,
  isNonNullable,
  useReferenceInputOptions,
} from 'sanity'
import {useRouter} from 'sanity/router'
import {usePaneRouter} from 'sanity/structure'

export function CreateNewIncomingReference({
  type,
  referenceToId,
  referenceToType,
  disableNew,
  onCreateNewReference,
}: {
  type: string
  referenceToId: string
  referenceToType: string
  disableNew: boolean
  onCreateNewReference: (id: string) => void
}) {
  const {initialValueTemplateItems} = useReferenceInputOptions()

  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = usePaneRouter()

  const handleCreate = useCallback(
    (option: CreateReferenceOption) => {
      const id = uuid()
      navigate({
        panes: [
          ...routerPanesState.slice(0, groupIndex + 1),
          [
            {
              id: getPublishedId(id),
              params: {type, template: option.template.id},
              payload: {
                reference: {
                  _type: 'reference',
                  _ref: referenceToId,
                  _weak: true,
                  _strengthenOnPublish: {type: referenceToType},
                },
              },
            },
          ],
        ],
      })
      onCreateNewReference(id)
    },
    [
      type,
      navigate,
      routerPanesState,
      groupIndex,
      referenceToId,
      referenceToType,
      onCreateNewReference,
    ],
  )

  const createOptions = useMemo(() => {
    if (disableNew) {
      return []
    }
    return (initialValueTemplateItems || [])

      .filter((i) => {
        return type === i.template?.schemaType
      })
      .map((item): CreateReferenceOption | undefined =>
        item.template?.schemaType
          ? {
              id: item.id,
              title: item.title || `${item.template.schemaType} from template ${item.template?.id}`,
              i18n: item.i18n,
              type: item.template.schemaType,
              icon: item.icon,
              template: {
                id: item.template?.id,
                params: item.parameters,
              },

              permission: {granted: item.granted, reason: item.reason},
            }
          : undefined,
      )
      .filter(isNonNullable)
  }, [disableNew, initialValueTemplateItems, type])

  return (
    <CreateReferenceButton
      id={`create-new-incoming-reference-${type}`}
      createOptions={createOptions}
      onCreate={handleCreate}
    />
  )
}
