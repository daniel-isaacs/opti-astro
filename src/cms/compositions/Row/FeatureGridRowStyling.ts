// @ts-nocheck

import type { CompositionStructureNode } from '../../../../__generated/sdk.ts';
import { getDictionaryFromDisplaySettings } from '../../../graphql/shared/displaySettingsHelpers.ts';

export type GridLayout = 'featuredLeft' | 'featuredRight' | 'spotlightTop' | 'grid2x2' | 'tallLeft2x2Right';

export interface FeatureGridRowStyleConfig {
    gridLayout: GridLayout;
    layoutClass: string;
    widthClasses: string;
    gapClass: string;
    verticalSpacingClass: string;
}

const layoutClassMap: Record<GridLayout, string> = {
    featuredLeft: 'layout-featured-left',
    featuredRight: 'layout-featured-right',
    spotlightTop: 'layout-spotlight-top',
    grid2x2: 'layout-grid-2x2',
    tallLeft2x2Right: 'layout-tall-left-2x2-right',
};

const widthMap: Record<string, string> = {
    full: 'w-full',
    container: 'container mx-auto px-8',
    max7xl: 'max-w-7xl w-full mx-auto px-8',
    max6xl: 'max-w-6xl w-full mx-auto px-8',
    max5xl: 'max-w-5xl w-full mx-auto px-8',
    max4xl: 'max-w-4xl w-full mx-auto px-8',
    max3xl: 'max-w-3xl w-full mx-auto px-8',
    max2xl: 'max-w-2xl w-full mx-auto px-8',
    maxXl: 'max-w-xl w-full mx-auto px-8',
    maxLg: 'max-w-lg w-full mx-auto px-8',
    maxMd: 'max-w-md w-full mx-auto px-8',
    maxSm: 'max-w-sm w-full mx-auto px-8',
    maxXs: 'max-w-xs w-full mx-auto px-8',
};

const gapMap: Record<string, string> = {
    none: 'gap-0',
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-8',
    xl: 'gap-12',
    xxl: 'gap-16',
};

const verticalSpacingMap: Record<string, string> = {
    none: 'my-0',
    small: 'my-2',
    medium: 'my-4',
    large: 'my-8',
    verylarge: 'my-20 lg:my-40',
};

export function getFeatureGridRowStyleConfig(
    row: CompositionStructureNode
): FeatureGridRowStyleConfig {
    const dict = getDictionaryFromDisplaySettings(row.displaySettings);

    const gridLayout = (dict['gridLayout'] as GridLayout) || 'featuredLeft';

    return {
        gridLayout,
        layoutClass: layoutClassMap[gridLayout] ?? 'layout-featured-left',
        widthClasses:
            dict['rowWidth'] && dict['rowWidth'] !== 'inherit'
                ? (widthMap[dict['rowWidth']] ?? '')
                : '',
        gapClass: gapMap[dict['contentSpacing']] ?? 'gap-4',
        verticalSpacingClass: verticalSpacingMap[dict['verticalSpacing']] ?? '',
    };
}
