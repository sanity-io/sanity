import {Card, Grid} from '@sanity/ui'
import React, {useCallback} from 'react'
import {FieldMember, MemberField, NumberInputProps, ObjectInputProps} from 'sanity/form'
import {CoordinateInput} from './CoordinateInput'

export interface LocationValue {
  lat?: number
  lng?: number
}

// Here we extend the `ObjectInputProps` type
// and inform it that we are working with a value of `LocationValue`
export type LocationInputProps = ObjectInputProps<LocationValue>

export function LocationInput(props: LocationInputProps) {
  const {members, renderField, renderItem} = props

  // find "lat" member
  const latMember = members.find(
    (member) => member.kind === 'field' && member.name === 'lat'
  ) as FieldMember

  // find "lng" member
  const lngMember = members.find(
    (member) => member.kind === 'field' && member.name === 'lat'
  ) as FieldMember

  const renderCoordinateInput = useCallback((inputProps: NumberInputProps) => {
    return <CoordinateInput {...inputProps} />
  }, [])

  return (
    <Card padding={2} radius={2} tone="positive">
      <Grid columns={2} gap={3}>
        {latMember && (
          <MemberField
            member={latMember}
            renderInput={renderCoordinateInput}
            renderField={renderField}
            renderItem={renderItem}
          />
        )}

        {lngMember && (
          <MemberField
            member={lngMember}
            renderInput={renderCoordinateInput}
            renderField={renderField}
            renderItem={renderItem}
          />
        )}
      </Grid>
    </Card>
  )
}
