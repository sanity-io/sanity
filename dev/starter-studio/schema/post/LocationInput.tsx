import {Card, Grid} from '@sanity/ui'
import React from 'react'
import {FieldMember, FormNode, ObjectInputProps} from 'sanity/form'
import {CoordinateInput} from './CoordinateInput'

export interface LocationValue {
  lat?: number
  lng?: number
}

// Here we extend the `ObjectInputProps` type
// and inform it that we are working with a value of `LocationValue`
export type LocationInputProps = ObjectInputProps<LocationValue>

export function LocationInput(props: LocationInputProps) {
  const {members} = props
  const fieldMembers = members.filter((member) => member.type === 'field') as FieldMember[]

  // Find the field members we want to render below
  // NOTE: this is cumbersome, and something we need to improve
  const latFieldMember = fieldMembers.find((member) => member.field.name === 'lat')
  const lngFieldMember = fieldMembers.find((member) => member.field.name === 'lng')

  return (
    <Card padding={2} radius={2} tone="positive">
      <Grid columns={2} gap={3}>
        {latFieldMember && (
          <FormNode component={CoordinateInput as any} fieldProps={latFieldMember.field} />
        )}

        {lngFieldMember && (
          <FormNode component={CoordinateInput as any} fieldProps={lngFieldMember.field} />
        )}
      </Grid>
    </Card>
  )
}
