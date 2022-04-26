import {Card, Grid} from '@sanity/ui'
import React from 'react'
import {FormFieldMember, ObjectInputProps} from 'sanity/form'
import {CoordinateInput} from './CoordinateInput'

export interface LocationValue {
  lat?: number
  lng?: number
}

// Here we extend the `ObjectInputProps` type
// and inform it that we are working with a value of `LocationValue`
export type LocationInputProps = ObjectInputProps<LocationValue>

export function LocationInput() {
  return (
    <Card padding={2} radius={2} tone="positive">
      <Grid columns={2} gap={3}>
        <FormFieldMember component={CoordinateInput as any} name="lat" />
        <FormFieldMember component={CoordinateInput as any} name="lng" />
      </Grid>
    </Card>
  )
}
