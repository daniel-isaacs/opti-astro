import type { DisplaySettingsFragment } from '../../../../__generated/sdk.ts';
import { getDictionaryFromDisplaySettings } from '../../../graphql/shared/displaySettingsHelpers.ts';

export interface ParagraphStyleConfig {
    paragraphAlignment: string;
    textColor: string;
}


const alignmentMap: Record<string, string> = {
    'full_width': 'w-full',
    'centered_large': 'max-w-6xl mx-auto',
    'centered_medium': 'max-w-4xl mx-auto',
    'centered_small': 'max-w-2xl mx-auto'
};

const textColorMap: Record<string, string> = {
    'default': '',
    'primary': 'text-primary',
    'secondary': 'text-secondary',
    'accent': 'text-accent',
    'neutral': 'text-neutral',
    'base100': 'text-base-100',
    'base200': 'text-base-200',
    'base300': 'text-base-300',
    'info': 'text-info',
    'success': 'text-success',
    'warning': 'text-warning',
    'error': 'text-error',
};

export function getParagraphStyleConfig(
    displaySettings: DisplaySettingsFragment[],
    displayTemplateKey?: string
): ParagraphStyleConfig {
    const settingsDict = getDictionaryFromDisplaySettings(displaySettings);

    return {
        paragraphAlignment: alignmentMap[settingsDict['paragraph_alignment']] || 'w-full',
        textColor: textColorMap[settingsDict['text_color']] ?? '',
    };
}