import type { CSSObject, MixinsOptions } from '@mui/material/styles';

import { borderGradient } from './border';
import { maxLine, textGradient } from './text';
import { bgBlur, bgGradient } from './background';
import { paperStyles, menuItemStyles } from './global-styles-components';

// ----------------------------------------------------------------------

export type * from './text';
export type * from './border';
export type * from './background';
export type * from './global-styles-components';

export type MixinsExtend = {
  hideScrollX: CSSObject;
  hideScrollY: CSSObject;
  bgBlur: typeof bgBlur;
  maxLine: typeof maxLine;
  bgGradient: typeof bgGradient;
  paperStyles: typeof paperStyles;
  textGradient: typeof textGradient;
  borderGradient: typeof borderGradient;
  menuItemStyles: typeof menuItemStyles;
};

/**
 * TypeScript (type definition and extension)
 * @to {@link file://./../../extend-theme-types.d.ts}
 */

export const mixins: MixinsOptions = {
  hideScrollX: {
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    overflowX: 'auto',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  hideScrollY: {
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    overflowY: 'auto',
    '&::-webkit-scrollbar': { display: 'none' },
  },
  borderGradient,
  bgGradient,
  bgBlur,
  textGradient,
  paperStyles,
  menuItemStyles,
  maxLine,
};
