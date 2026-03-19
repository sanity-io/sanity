// This file previously contained styled-components utility functions.
// They have been removed as part of the vanilla-extract migration.
// The styled components that consumed these functions have been migrated.

export interface TextInputInputStyleProps {
  $fontSize: number[]
  $scheme: string
  $tone: string
  $weight?: string
}

export interface TextInputRepresentationStyleProps {
  $hasPrefix?: boolean
  $hasSuffix?: boolean
  $scheme: string
  $tone: string
  $unstableDisableFocusRing?: boolean
}

export interface TextInputResponsivePaddingStyleProps {
  $fontSize: number[]
  $iconLeft?: boolean
  $iconRight?: boolean
  $padding: number[]
  $space: number[]
}
