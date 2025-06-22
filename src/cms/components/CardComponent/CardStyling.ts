import type { DisplaySettingsFragment } from '../../../../__generated/sdk.ts';
import { getDictionaryFromDisplaySettings } from '../../../graphql/shared/displaySettingsHelpers.ts';

export function getCardStyles(displaySettings: DisplaySettingsFragment[]): {
} {
    const settings: Record<string, string> =
        getDictionaryFromDisplaySettings(displaySettings);
    
    let cssClasses: string[] = [];

    // Note: button styles managed via: src\cms\components\ButtonComponent\ButtonStyling.ts
    return cssClasses;
}

export function getCardTextAlignmentStyle(
    displaySettings: DisplaySettingsFragment[]
): string[] {
    const settings: Record<string, string> =
        getDictionaryFromDisplaySettings(displaySettings);
    let cssClasses: string[] = [];
    switch (settings['textAlign']) {
        case 'left':
            cssClasses.push('text-left mr-auto');
            break;
        case 'center':
            cssClasses.push('text-center mx-auto');
            break;
        case 'right':
            cssClasses.push('text-right ml-auto');
            break;
        case 'justify':
            cssClasses.push('text-justify');
            break;
        default:
            break;
    }
    
    return cssClasses;
}


export function getCardHeaderStyles(
    displaySettings: DisplaySettingsFragment[]
): string[] {
    const settings: Record<string, string> =
        getDictionaryFromDisplaySettings(displaySettings);
    let cssClasses: string[] = [];
    switch (settings['transformHeader']) {
        case 'uppercase':
            cssClasses.push('uppercase');
            break;
        case 'lowercase':
            cssClasses.push('lowercase');
            break;
        case 'capitalize':
            cssClasses.push('capitalize');
            break;
    }
    return cssClasses;
}
