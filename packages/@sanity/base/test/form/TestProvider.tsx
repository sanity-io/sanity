/* eslint-disable camelcase */

import React, {useMemo} from 'react'
import {SanityClient} from '@sanity/client'
import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {Schema} from '@sanity/types'
import {createAuthController} from '../../src/auth'
import {Source, Workspace} from '../../src/config'
import {createAuthStore, createUserStore} from '../../src/datastores'
import {SourceProvider, WorkspaceProvider} from '../../src/studio'
import {createMockBifurClient} from '../mocks/mockBifur'
import {
  defaultRenderField,
  defaultRenderInput,
  defaultRenderItem,
  defaultRenderPreview,
} from '../../src/form/studio/defaults'

export function TestProvider(props: {
  children?: React.ReactNode
  client: SanityClient
  schema: Schema
}) {
  const {children, client, schema} = props

  const currentUser: Workspace['currentUser'] = useMemo(
    () => ({
      id: 'doug',
      name: 'Doug',
      email: 'doug@sanity.io',
      role: 'admin',
      roles: [{name: 'admin', title: 'Admin'}],
    }),
    []
  )

  const form: Workspace['form'] = useMemo(
    () => ({
      file: {
        assetSources: [],
        directUploads: false,
      },
      image: {
        assetSources: [],
        directUploads: false,
      },
      renderField: defaultRenderField,
      renderInput: defaultRenderInput,
      renderItem: defaultRenderItem,
      renderPreview: defaultRenderPreview,
    }),
    []
  )

  const projectId = 'test'

  const documentConfig: Workspace['document'] = useMemo(
    () => ({
      actions: () => [],
      badges: () => [],
      resolveNewDocumentOptions: () => [],
      resolveProductionUrl: () => Promise.resolve(undefined),
    }),
    []
  )

  const tools: Workspace['tools'] = useMemo(() => [], [])

  const authController = useMemo(() => createAuthController({client, config: {}}), [client])
  const authStore = useMemo(() => createAuthStore({projectId}), [])

  const userStore = useMemo(
    () =>
      createUserStore({
        authController,
        authStore,
        client,
        projectId,
      }),
    [authController, authStore, client]
  )

  const bifur = useMemo(() => createMockBifurClient(), [])

  const __internal: Workspace['__internal'] = useMemo(
    () => ({
      auth: {
        controller: authController,
        store: authStore,
      },
      bifur,
      userStore,
      staticInitialValueTemplateItems: [],
    }),
    [authController, authStore, bifur, userStore]
  )

  const templates: Workspace['templates'] = useMemo(() => [], [])

  const source: Source = useMemo(
    () => ({
      __internal,
      client,
      currentUser,
      dataset: 'test',
      document: documentConfig,
      form,
      name: 'test',
      projectId,
      schema,
      templates,
      title: 'Test',
      tools,
    }),
    [__internal, client, currentUser, documentConfig, form, projectId, schema, templates, tools]
  )

  const workspace: Workspace = useMemo(
    () => ({
      __internal,
      basePath: '/',
      client,
      currentUser,
      dataset: 'test',
      document: documentConfig,
      form,
      name: 'test',
      projectId,
      schema,
      templates,
      theme: studioTheme,
      title: 'Test',
      tools,
      unstable_sources: [source],
    }),
    [__internal, client, currentUser, documentConfig, form, schema, source, templates, tools]
  )

  return (
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <LayerProvider>
          <WorkspaceProvider workspace={workspace}>
            <SourceProvider name="test">{children}</SourceProvider>
          </WorkspaceProvider>
        </LayerProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
