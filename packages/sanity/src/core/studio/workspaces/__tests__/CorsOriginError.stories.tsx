import {type Meta, type StoryObj} from '@storybook/react-vite'

import {CorsOriginErrorScreen} from '../CorsOriginErrorScreen'

/**
 * Chromatic sentinel for the CORS origin error screen after the ui5 Box
 * migration. The register / add-CORS / credentials branches pair Box
 * max-width with Card/Button/Grid layout — a mix TypeScript will not catch.
 * Origin and project IDs are fixtures (no live CORS probe, no timestamps).
 *
 * The register card renders one extra line ("Recommended for production…")
 * only when `process.env.NODE_ENV === 'production'`, so the Chromatic
 * capture of `RegisterAndAddCors` is one text row taller than the local
 * Storybook dev server / addon-vitest render. That difference is expected.
 */
const meta = {
  title: 'Studio/CORS Origin Error',
  component: CorsOriginErrorScreen,
  args: {
    isStaging: false,
    origin: 'https://cms.example.com',
    projectId: 'ppsg7ml5',
    primaryProjectId: 'ppsg7ml5',
  },
} satisfies Meta<typeof CorsOriginErrorScreen>

export default meta
type Story = StoryObj<typeof meta>

/** Registerable origin: two-column grid with the "Register Studio" card. */
export const RegisterAndAddCors: Story = {}

/** Localhost origins cannot be registered as a Studio host: single-column grid. */
export const AddCorsOnly: Story = {
  args: {origin: 'http://localhost:3333'},
}

/** Origin is allow-listed but without credentials: "re-add with credentials" branch. */
export const CredentialsDisabled: Story = {
  args: {allowed: true, withCredentials: false},
}
