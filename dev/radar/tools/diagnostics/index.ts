import {WrenchIcon} from '@sanity/icons/Wrench'
import {type Tool} from 'sanity'

import {DiagnosticsTool} from './DiagnosticsTool'

/** Paste-in viewer for Studio diagnostics JSON — see DiagnosticsTool. */
export const diagnosticsTool: Tool = {
  name: 'diagnostics',
  title: 'Diagnostics viewer',
  icon: WrenchIcon,
  component: DiagnosticsTool,
}
