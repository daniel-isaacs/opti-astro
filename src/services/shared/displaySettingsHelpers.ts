import { DisplaySettingsFragment } from "../graphql/__generated/sdk.ts";

export function getDictionaryFromDisplaySettings(
  displaySettings: DisplaySettingsFragment[],
): Record<string, string> {
  const dictionary: Record<string, string> = {};
  displaySettings.forEach((setting) => {
    dictionary[setting.key] = setting.value;
  });
  return dictionary;
}
