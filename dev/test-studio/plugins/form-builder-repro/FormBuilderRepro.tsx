import {Card, Heading, Stack, Text} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {ChangeIndicatorsTracker, createPatchChannel, FormBuilder, useDocumentForm} from 'sanity'

import {FORM_BUILDER_REPRO_TYPE} from './plugin'

/**
 * Reproduction for the `useDocumentDivergences` crash reported by plugin authors
 * (e.g. the Vercel Deploy plugin's "Add Project" dialog).
 *
 * This tool mounts `<FormBuilder>` outside any `DocumentPaneProvider`, mirroring
 * the shape of a plugin that opens a dialog containing form fields for creating
 * a "hidden" document. Before the FormBuilder fix this throws:
 *
 *   Error: useDocumentDivergences must be used within a DocumentDivergencesContext
 *
 * After the fix it renders cleanly.
 *
 * The schema type used here (`formBuilderReproDoc`) is intentionally minimal:
 * no incoming reference decorations, no document actions, no inspectors — so any
 * error that surfaces is attributable to the `FormBuilder` itself, not to schema
 * features that also depend on a `DocumentPaneProvider`.
 */
export function FormBuilderRepro() {
  const [patchChannel] = useState(() => createPatchChannel())
  const [documentId] = useState(() => `repro-${Date.now()}`)

  const initialValue = useMemo(
    () => ({
      loading: false,
      value: {
        _id: documentId,
        _type: FORM_BUILDER_REPRO_TYPE,
      },
      error: null,
    }),
    [documentId],
  )

  const {
    formState,
    onChange,
    onPathOpen,
    onFocus,
    onBlur,
    onSetActiveFieldGroup,
    onSetCollapsedFieldSet,
    onSetCollapsedPath,
    collapsedFieldSets,
    ready,
    collapsedPaths,
    schemaType,
    value,
  } = useDocumentForm({
    documentId,
    documentType: FORM_BUILDER_REPRO_TYPE,
    initialValue,
  })

  if (formState === null || !ready) {
    return (
      <Card padding={5}>
        <Text muted>Loading form...</Text>
      </Card>
    )
  }

  return (
    <Card padding={5}>
      <Stack space={4}>
        <Heading>FormBuilder repro</Heading>
        <Text muted size={1}>
          Renders `&lt;FormBuilder&gt;` outside `DocumentPaneProvider`. Without the FormBuilder
          DivergencesProvider fix, this throws `useDocumentDivergences must be used within a
          DocumentDivergencesContext`.
        </Text>
        <Card border padding={4} radius={2}>
          <ChangeIndicatorsTracker>
            <FormBuilder
              __internal_patchChannel={patchChannel}
              id="root"
              onChange={onChange}
              onPathFocus={onFocus}
              onPathOpen={onPathOpen}
              onPathBlur={onBlur}
              onFieldGroupSelect={onSetActiveFieldGroup}
              onSetFieldSetCollapsed={onSetCollapsedFieldSet}
              onSetPathCollapsed={onSetCollapsedPath}
              collapsedPaths={collapsedPaths}
              collapsedFieldSets={collapsedFieldSets}
              focusPath={formState.focusPath}
              changed={formState.changed}
              focused={formState.focused}
              groups={formState.groups}
              validation={formState.validation}
              members={formState.members}
              presence={formState.presence}
              schemaType={schemaType}
              value={value}
              hasUpstreamVersion={false}
            />
          </ChangeIndicatorsTracker>
        </Card>
      </Stack>
    </Card>
  )
}
