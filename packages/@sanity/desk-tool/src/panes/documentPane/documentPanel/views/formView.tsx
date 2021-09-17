// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {PresenceOverlay} from '@sanity/base/presence'
import {Marker, Path, SanityDocument} from '@sanity/types'
import {Box, Button, Container, Text} from '@sanity/ui'
import {isActionEnabled} from 'part:@sanity/base/util/document-action-utils'
import schema from 'part:@sanity/base/schema'
import afterEditorComponents from 'all:part:@sanity/desk-tool/after-editor-component'
import filterFieldFn$ from 'part:@sanity/desk-tool/filter-fields-fn?'
import React from 'react'
import {Subscription} from 'rxjs'
import {EditForm} from './editForm'

interface FormViewProps {
  id: string
  readOnly?: boolean
  value: Partial<SanityDocument> | null
  compareValue: SanityDocument | null
  initialValue: Partial<SanityDocument>
  isConnected: boolean
  onChange: (patches: any[]) => void
  schemaType: {name: string; title: string}
  markers: Marker[]
  focusPath: Path
  onFocus: (path: Path) => void
  margins: [number, number, number, number]
}

const noop = () => undefined

const INITIAL_STATE = {
  filterField: () => true,
}

export class FormView extends React.PureComponent<FormViewProps> {
  static defaultProps = {
    markers: [],
    isConnected: true,
  }

  state = INITIAL_STATE

  filterFieldFnSubscription: Subscription | null = null

  componentDidMount() {
    if (filterFieldFn$) {
      this.filterFieldFnSubscription = filterFieldFn$.subscribe((filterField: any) =>
        this.setState({filterField})
      )
    }
  }

  componentWillUnmount() {
    if (this.filterFieldFnSubscription) {
      this.filterFieldFnSubscription.unsubscribe()
    }
  }

  handleBlur = () => {
    // do nothing
  }

  handleEditAsActualType = () => {
    // @todo
  }

  isReadOnly() {
    const {value, schemaType, isConnected, readOnly} = this.props
    const isNonExistent = !value || !value._id

    return (
      readOnly ||
      !isConnected ||
      !isActionEnabled(schemaType, 'update') ||
      (isNonExistent && !isActionEnabled(schemaType, 'create'))
    )
  }

  render() {
    const {
      id,
      focusPath,
      onFocus,
      value,
      initialValue,
      markers,
      schemaType,
      compareValue,
      margins,
    } = this.props
    const {filterField} = this.state
    const readOnly = this.isReadOnly()
    const documentId = value && value._id && value._id.replace(/^drafts\./, '')
    const hasTypeMismatch = value && value._type && value._type !== schemaType.name

    if (hasTypeMismatch) {
      return (
        <Container paddingX={4} paddingY={5} sizing="border" width={1}>
          <Text>
            This document is of type <code>{value?._type}</code> and cannot be edited as{' '}
            <code>{schemaType.name}</code>.
          </Text>

          <Box marginTop={4}>
            <Button
              onClick={this.handleEditAsActualType}
              text={<>Edit as {value?._type} instead</>}
              tone="critical"
            />
          </Box>
        </Container>
      )
    }

    return (
      <Container paddingX={4} paddingTop={5} paddingBottom={9} sizing="border" width={1}>
        <PresenceOverlay margins={margins}>
          <EditForm
            id={id}
            value={value || initialValue}
            compareValue={compareValue}
            filterField={filterField}
            focusPath={focusPath}
            markers={markers}
            onBlur={this.handleBlur}
            onChange={readOnly ? noop : this.props.onChange}
            onFocus={onFocus}
            readOnly={readOnly}
            schema={schema}
            type={schemaType}
          />
        </PresenceOverlay>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {afterEditorComponents.map((AfterEditorComponent: any, idx: number) => (
          <AfterEditorComponent key={String(idx)} documentId={documentId} />
        ))}
      </Container>
    )
  }
}
