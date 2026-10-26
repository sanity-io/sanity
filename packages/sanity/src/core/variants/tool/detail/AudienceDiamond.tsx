import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'

/**
 * The audience dimension's glyph: the variant diamond, cropped to the diamond so it reads at the size of the other dimension
 * icons (the bare RhombusIcon draws it in the middle third of a 25-unit box). The users glyph clashed with the user avatar.
 * Same viewBox as the Handoff Studio ships.
 *
 * @internal
 */
export function AudienceDiamond(): React.JSX.Element {
  return <RhombusIcon viewBox="3.5 3.5 18 18" />
}
