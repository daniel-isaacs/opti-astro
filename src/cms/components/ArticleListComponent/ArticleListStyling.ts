import type { DisplaySettingsFragment } from '../../../../__generated/sdk.ts';
import { getDictionaryFromDisplaySettings } from '../../../graphql/shared/displaySettingsHelpers.ts';

export interface ArticleListStyleConfig {
    bento_grid_type: string;
}

// const alignmentMap: Record<string, string> = {
//     'full_width': 'w-full',
//     'centered_large': 'max-w-6xl mx-auto',
//     'centered_medium': 'max-w-4xl mx-auto',
//     'centered_small': 'max-w-2xl mx-auto'
// };

export function getArticleListStyleConfig(
    displaySettings: DisplaySettingsFragment[],
    displayTemplateKey?: string
): ArticleListStyleConfig {
    const settingsDict = getDictionaryFromDisplaySettings(displaySettings);
    
    return {
        // Alignment settings
        bento_grid_type: settingsDict['bento_grid_type'] || '',
    };
}