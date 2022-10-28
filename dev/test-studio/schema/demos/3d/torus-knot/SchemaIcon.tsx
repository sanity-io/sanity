import React from 'react'
import styled from 'styled-components'
// @ts-expect-error -- png import not setup yet
import png from './torus-knot.png'

const Img = styled.img`
  filter: contrast(4);
  mix-blend-mode: luminosity;
`

export const SchemaIcon = () => <Img src={png} alt="" loading="lazy" height={70} width={70} />
