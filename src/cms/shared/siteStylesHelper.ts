export function getSiteStyles(siteStyles: any): string {
    const styles: string[] = [];

    // DaisyUI Theme
    if(siteStyles?.daisyuiTheme) {
        const regex = /--[a-zA-Z0-9_-]+\s*:\s*[^;]+/g;
        const variables = siteStyles?.daisyuiTheme.match(regex);
        if(variables) {
            variables.forEach((variable: string) => {
                styles.push(variable);
            });
        }
    }
    // Colors
    siteStyles?.primary && styles.push(`--color-primary: ${siteStyles.primary}`);
    siteStyles?.primaryContent && styles.push(`--color-primary-content: ${siteStyles.primaryContent}`);
    siteStyles?.secondary && styles.push(`--color-secondary: ${siteStyles.secondary}`);
    siteStyles?.secondaryContent && styles.push(`--color-secondary-content: ${siteStyles.secondaryContent}`);
    siteStyles?.accent && styles.push(`--color-accent: ${siteStyles.accent}`);
    siteStyles?.accentContent && styles.push(`--color-accent-content: ${siteStyles.accentContent}`);
    siteStyles?.neutral && styles.push(`--color-neutral: ${siteStyles.neutral}`);
    siteStyles?.neutralContent && styles.push(`--color-neutral-content: ${siteStyles.neutralContent}`);
    siteStyles?.base100 && styles.push(`--color-base-100: ${siteStyles.base100}`);
    siteStyles?.base200 && styles.push(`--color-base-200: ${siteStyles.base200}`);
    siteStyles?.base300 && styles.push(`--color-base-300: ${siteStyles.base300}`);
    siteStyles?.baseContent && styles.push(`--color-base-content: ${siteStyles.baseContent}`);
    siteStyles?.info && styles.push(`--color-info: ${siteStyles.info}`);
    siteStyles?.infoContent && styles.push(`--color-info-content: ${siteStyles.infoContent}`);
    siteStyles?.success && styles.push(`--color-success: ${siteStyles.success}`);
    siteStyles?.successContent && styles.push(`--color-success-content: ${siteStyles.successContent}`);
    siteStyles?.warning && styles.push(`--color-warning: ${siteStyles.warning}`);
    siteStyles?.warningContent && styles.push(`--color-warning-content: ${siteStyles.warningContent}`);
    siteStyles?.error && styles.push(`--color-error: ${siteStyles.error}`);
    siteStyles?.errorContent && styles.push(`--color-error-content: ${siteStyles.errorContent}`);

    // Radius
    siteStyles?.radiusSelector && styles.push(`--radius-selector: ${siteStyles.radiusSelector}`);
    siteStyles?.radiusField && styles.push(`--radius-field: ${siteStyles.radiusField}`);
    siteStyles?.radiusBox && styles.push(`--radius-box: ${siteStyles.radiusBox}`);

    // Misc
    siteStyles?.sizeSelector && styles.push(`--size-selector: ${siteStyles.sizeSelector}`);
    siteStyles?.sizeField && styles.push(`--size-field: ${siteStyles.sizeField}`);
    siteStyles?.borderWidth && styles.push(`--border: ${siteStyles.borderWidth}px`);
    typeof siteStyles?.depth !== 'undefined' && styles.push(`--depth: ${siteStyles.depth ? 1 : 0}`);
    typeof siteStyles?.noise !== 'undefined' && styles.push(`--noise: ${siteStyles.noise ? 1 : 0}`);

    // Text Sizes
    siteStyles?.textXs && styles.push(`--text-xs: ${siteStyles.textXs}`);
    siteStyles?.textSm && styles.push(`--text-sm: ${siteStyles.textSm}`);
    siteStyles?.textBase && styles.push(`--text-base: ${siteStyles.textBase}`);
    siteStyles?.textLg && styles.push(`--text-lg: ${siteStyles.textLg}`);
    siteStyles?.textXl && styles.push(`--text-xl: ${siteStyles.textXl}`);
    siteStyles?.text2xl && styles.push(`--text-2xl: ${siteStyles.text2xl}`);
    siteStyles?.text3xl && styles.push(`--text-3xl: ${siteStyles.text3xl}`);
    siteStyles?.text4xl && styles.push(`--text-4xl: ${siteStyles.text4xl}`);
    siteStyles?.text5xl && styles.push(`--text-5xl: ${siteStyles.text5xl}`);
    siteStyles?.text6xl && styles.push(`--text-6xl: ${siteStyles.text6xl}`);
    siteStyles?.text7xl && styles.push(`--text-7xl: ${siteStyles.text7xl}`);
    siteStyles?.text8xl && styles.push(`--text-8xl: ${siteStyles.text8xl}`);
    siteStyles?.text9xl && styles.push(`--text-9xl: ${siteStyles.text9xl}`);

    // Freeform Styles
    siteStyles?.freeFormStyles && styles.push(`${siteStyles.freeFormStyles}`);
    
    return styles.join('; ');
}

export function getSiteFont(siteStyles: any): FontVariable | null {
    const fontStyle: FontVariable | null = siteStyles?.font !== 'default' ? siteStyles?.font : null;
    return fontStyle;
}

export type FontVariable = 
    | "--font-alegreya"
    | "--font-alegreya-sans"
    | "--font-archivo-narrow"
    | "--font-biorhyme"
    | "--font-cardo"
    | "--font-chivo"
    | "--font-cormorant"
    | "--font-crimson-text"
    | "--font-dm-sans"
    | "--font-eczar"
    | "--font-fira-sans"
    | "--font-fraunces"
    | "--font-heebo"
    | "--font-ibm-plex-sans"
    | "--font-ibm-plex-serif"
    | "--font-inconsolata"
    | "--font-inknut-antiqua"
    | "--font-inter"
    | "--font-karla"
    | "--font-lato"
    | "--font-libre-baskerville"
    | "--font-libre-franklin"
    | "--font-lora"
    | "--font-manrope"
    | "--font-merriweather"
    | "--font-montserrat"
    | "--font-neuton"
    | "--font-nunito"
    | "--font-open-sans"
    | "--font-oswald"
    | "--font-outfit"
    | "--font-playfair-display"
    | "--font-plus-jakarta-sans"
    | "--font-poppins"
    | "--font-proza-libre"
    | "--font-pt-sans"
    | "--font-pt-serif"
    | "--font-public-sans"
    | "--font-quicksand"
    | "--font-raleway"
    | "--font-roboto"
    | "--font-roboto-mono"
    | "--font-rubik"
    | "--font-source-sans-3"
    | "--font-source-serif-4"
    | "--font-space-grotesk"
    | "--font-space-mono"
    | "--font-spectral"
    | "--font-syne"
    | "--font-urbanist"
    | "--font-work-sans";

export type daisyColors = 
    | "--color-primary"
    | "--color-primary/90"
    | "--color-primary/80"
    | "--color-primary/70"
    | "--color-primary/60"
    | "--color-primary/50"
    | "--color-primary/40"
    | "--color-primary/30"
    | "--color-primary/20"
    | "--color-primary/10"
    | "--color-secondary"
    | "--color-secondary/90"
    | "--color-secondary/80"
    | "--color-secondary/70"
    | "--color-secondary/60"
    | "--color-secondary/50"
    | "--color-secondary/40"
    | "--color-secondary/30"
    | "--color-secondary/20"
    | "--color-secondary/10"
    | "--color-accent"
    | "--color-accent/90"
    | "--color-accent/80"
    | "--color-accent/70"
    | "--color-accent/60"
    | "--color-accent/50"
    | "--color-accent/40"
    | "--color-accent/30"
    | "--color-accent/20"
    | "--color-accent/10"
    | "--color-neutral"
    | "--color-neutral/90"
    | "--color-neutral/80"
    | "--color-neutral/70"
    | "--color-neutral/60"
    | "--color-neutral/50"
    | "--color-neutral/40"
    | "--color-neutral/30"
    | "--color-neutral/20"
    | "--color-neutral/10"
    | "--color-info"
    | "--color-info/90"
    | "--color-info/80"
    | "--color-info/70"
    | "--color-info/60"
    | "--color-info/50"
    | "--color-info/40"
    | "--color-info/30"
    | "--color-info/20"
    | "--color-info/10"
    | "--color-success"
    | "--color-success/90"
    | "--color-success/80"
    | "--color-success/70"
    | "--color-success/60"
    | "--color-success/50"
    | "--color-success/40"
    | "--color-success/30"
    | "--color-success/20"
    | "--color-success/10"
    | "--color-warning"
    | "--color-warning/90"
    | "--color-warning/80"
    | "--color-warning/70"
    | "--color-warning/60"
    | "--color-warning/50"
    | "--color-warning/40"
    | "--color-warning/30"
    | "--color-warning/20"
    | "--color-warning/10"
    | "--color-error"
    | "--color-error/90"
    | "--color-error/80"
    | "--color-error/70"
    | "--color-error/60"
    | "--color-error/50"
    | "--color-error/40"
    | "--color-error/30"
    | "--color-error/20"
    | "--color-error/10"
    | "--color-base-100"
    | "--color-base-100/90"
    | "--color-base-100/80"
    | "--color-base-100/70"
    | "--color-base-100/60"
    | "--color-base-100/50"
    | "--color-base-100/40"
    | "--color-base-100/30"
    | "--color-base-100/20"
    | "--color-base-100/10"
    | "--color-base-200"
    | "--color-base-200/90"
    | "--color-base-200/80"
    | "--color-base-200/70"
    | "--color-base-200/60"
    | "--color-base-200/50"
    | "--color-base-200/40"
    | "--color-base-200/30"
    | "--color-base-200/20"
    | "--color-base-200/10"
    | "--color-base-300"
    | "--color-base-300/90"
    | "--color-base-300/80"
    | "--color-base-300/70"
    | "--color-base-300/60"
    | "--color-base-300/50"
    | "--color-base-300/40"
    | "--color-base-300/30"
    | "--color-base-300/20"
    | "--color-base-300/10"
    | "--color-transparent"

    | "text-accent/60"