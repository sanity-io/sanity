/* eslint-disable camelcase */

import { useTheme_v2 } from "@sanity/ui";
import { rgba } from "@sanity/ui/theme";
import { setElementVars } from "@vanilla-extract/dynamic";
import { useInsertionEffect } from "react";

import {
  uiFontTextFamily,
  uiColoBg,
  formGutterSize,
  formGutterGap,
  webkitResizerSvg,
  uiFontTextWeightsMedium,
  uiColorBorder,
  uiColorMutedFg,
  selectionBackgroundColor,
} from "./styles.css";
import { useWorkspace } from "./workspace";

// Construct a resize handle icon as a data URI, to be displayed in browsers that support the `::-webkit-resizer` selector.
function buildResizeHandleDataUri(hexColor: string) {
  const encodedStrokeColor = encodeURIComponent(hexColor);
  const encodedSvg = `%3Csvg width='9' height='9' viewBox='0 0 9 9' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 8L8 1' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3Cpath d='M5 8L8 5' stroke='${encodedStrokeColor}' stroke-linecap='round'/%3E%3C/svg%3E%0A`;
  return `url("data:image/svg+xml,${encodedSvg}")`;
}

export const GlobalStyle = (): null => {
  const {
    advancedVersionControl: { enabled: advancedVersionControlEnabled },
  } = useWorkspace();

  const { color, font, space } = useTheme_v2();
  const webkitResizerSvgDataUri = buildResizeHandleDataUri(color.icon);
  const selectionBackgroundColorVar = rgba(color.focusRing, 0.3);

  useInsertionEffect(() => {
    setElementVars(document.documentElement, {
      [formGutterSize]: advancedVersionControlEnabled ? `${space[4]}px` : "0px",
      [formGutterGap]: advancedVersionControlEnabled ? `${space[3]}px` : "0px",
      [selectionBackgroundColor]: selectionBackgroundColorVar,
      [uiFontTextFamily]: font.text.family,
      [uiFontTextWeightsMedium]: font.text.weights.medium.toString(),
      [uiColoBg]: color.bg,
      [uiColorBorder]: color.border,
      [uiColorMutedFg]: color.muted.fg,
      [webkitResizerSvg]: webkitResizerSvgDataUri,
    });
    return () => {
      setElementVars(document.documentElement, {
        [formGutterSize]: null,
        [formGutterGap]: null,
        [selectionBackgroundColor]: null,
        [uiFontTextFamily]: null,
        [uiFontTextWeightsMedium]: null,
        [uiColoBg]: null,
        [uiColorBorder]: null,
        [uiColorMutedFg]: null,
        [webkitResizerSvg]: null,
      });
    };
  }, [
    advancedVersionControlEnabled,
    space,
    selectionBackgroundColorVar,
    font.text.family,
    font.text.weights.medium,
    color.bg,
    color.border,
    color.muted.fg,
    webkitResizerSvgDataUri,
  ]);

  return null;
};
