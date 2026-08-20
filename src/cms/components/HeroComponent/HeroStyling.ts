import type { DisplaySettingsFragment } from '../../../../__generated/sdk.ts';
import { getDictionaryFromDisplaySettings } from '../../../graphql/shared/displaySettingsHelpers.ts';

export function getHeroStyles(displaySettings: DisplaySettingsFragment[]): {
    backgroundOpacityClass: string;
    textClasses: string[];
    justifyClass: string;
    heightClass: string;
    imageFitClass: string;
    calloutWidthClass: string;
    calloutPaddingClass: string;
    imageContainerClass: string;
} {
    const settings: Record<string, string> =
        getDictionaryFromDisplaySettings(displaySettings);
    const backgroundTintLevel = settings['background_tint_level'] ?? '60';
    let backgroundOpacityClass = '';
    switch (backgroundTintLevel) {
        case 'o_0':
            backgroundOpacityClass = 'bg-neutral/0';
            break;
        case 'o_10':
            backgroundOpacityClass = 'bg-neutral/10';
            break;
        case 'o_20':
            backgroundOpacityClass = 'bg-neutral/20';
            break;
        case 'o_30':
            backgroundOpacityClass = 'bg-neutral/30';
            break;
        case 'o_40':
            backgroundOpacityClass = 'bg-neutral/40';
            break;
        case 'o_50':
            backgroundOpacityClass = 'bg-neutral/50';
            break;
        case 'o_60':
            backgroundOpacityClass = 'bg-neutral/60';
            break;
        case 'o_70':
            backgroundOpacityClass = 'bg-neutral/70';
            break;
        case 'o_80':
            backgroundOpacityClass = 'bg-neutral/80';
            break;
        case 'o_90':
            backgroundOpacityClass = 'bg-neutral/90';
            break;
        case 'o_100':
            backgroundOpacityClass = 'bg-neutral/100';
            break;
        default:
            backgroundOpacityClass = 'bg-neutral/60';
            break;
    }

    const textPlacemenTintLevel = settings['text_placement'] ?? 'center';
    let justifyClass = '';
    let textClasses = [];
    let calloutPaddingClass = '';
    switch (textPlacemenTintLevel) {
        case 'left':
            textClasses.push('text-left');
            justifyClass = 'justify-start';
            calloutPaddingClass = 'pl-16 pr-6';
            break;
        case 'right':
            textClasses.push('text-right');
            justifyClass = 'justify-end';
            calloutPaddingClass = 'pl-6 pr-16';
            break;
        default:
            textClasses.push('text-center');
            justifyClass = 'justify-center';
            calloutPaddingClass = 'px-6';
            break;
    }

    const textColor = settings['text_color'] ?? 'white';
    switch (textColor) {
        case 'default':
            // Don't add any class, use theme default
            break;
        case 'white':
            textClasses.push('text-white');
            break;
        case 'black':
            textClasses.push('text-black');
            break;
        case 'neutral':
            textClasses.push('text-neutral');
            break;
        case 'primary':
            textClasses.push('text-primary');
            break;
        case 'secondary':
            textClasses.push('text-secondary');
            break;
        case 'accent':
            textClasses.push('text-accent');
            break;
        case 'info':
            textClasses.push('text-info');
            break;
        case 'success':
            textClasses.push('text-success');
            break;
        case 'warning':
            textClasses.push('text-warning');
            break;
        case 'error':
            textClasses.push('text-error');
            break;
        default:
            textClasses.push('text-white');
            break;
    }
    const heroHeight = settings['hero_height'] ?? 'h_48rem';
    let heightClass = '';
    switch (heroHeight) {
        case 'h_18rem':
            heightClass = 'h-[18rem]';
            break;
        case 'h_28rem':
            heightClass = 'h-[28rem]';
            break;
        case 'h_38rem':
            heightClass = 'h-[38rem]';
            break;
        case 'h_48rem':
            heightClass = 'h-[48rem]';
            break;
        default:
            heightClass = 'h-[48rem]';
            break;
    }
    const imageFit = settings['image_fit'] ?? 'object_cover';
    let imageFitClass = '';
    switch (imageFit) {
        case 'object_cover':
            imageFitClass = 'object-cover';
            break;
        case 'object_contain':
            imageFitClass = 'object-contain';
            break;
        case 'object_fill':
            imageFitClass = 'object-fill';
            break;
        default:
            imageFitClass = 'object-cover';
            break;
    }
    
    const calloutWidth = settings['calloutWidth'] ?? 'full';
    let calloutWidthClass = '';
    switch (calloutWidth) {
        case 'three_quarter':
            calloutWidthClass = 'w-3/4';
            break;
        case 'half':
            calloutWidthClass = 'w-1/2';
            break;
        case 'quarter':
            calloutWidthClass = 'w-1/4';
            break;
        default:
            calloutWidthClass = 'w-full';
            break;
    }

    const imageWidth = settings['imageWidth'] ?? 'full';
    const imagePlacement = settings['imagePlacement'] ?? 'center';
    let imageContainerClass = 'absolute inset-0';

    if (imageWidth !== 'full') {
        switch (imageWidth) {
            case 'three_quarter':
                switch (imagePlacement) {
                    case 'start':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-3/4 left-0';
                        break;
                    case 'end':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-3/4 right-0';
                        break;
                    default:
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-3/4 left-[12.5%]';
                        break;
                }
                break;
            case 'half':
                switch (imagePlacement) {
                    case 'start':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/2 left-0';
                        break;
                    case 'end':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/2 right-0';
                        break;
                    default:
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/2 left-1/4';
                        break;
                }
                break;
            case 'quarter':
                switch (imagePlacement) {
                    case 'start':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/4 left-0';
                        break;
                    case 'end':
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/4 right-0';
                        break;
                    default:
                        imageContainerClass = 'absolute top-0 bottom-0 h-full w-1/4 left-[37.5%]';
                        break;
                }
                break;
        }
    }

    return { backgroundOpacityClass, textClasses, justifyClass, heightClass, imageFitClass, calloutWidthClass, calloutPaddingClass, imageContainerClass };
}
