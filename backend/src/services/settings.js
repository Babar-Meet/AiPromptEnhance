import { AppSetting } from "../models/AppSetting.js";
import { DEFAULT_SETTINGS } from "../utils/constants.js";

export async function getSetting(key, fallback) {
  const found = await AppSetting.findOne({ key }).lean();
  if (!found) return fallback;
  return found.value;
}

export async function setSetting(key, value) {
  await AppSetting.updateOne({ key }, { key, value }, { upsert: true });
}

export async function ensureDefaultSettings() {
  const entries = Object.entries(DEFAULT_SETTINGS);
  await Promise.all(
    entries.map(([key, value]) =>
      AppSetting.updateOne(
        { key },
        { $setOnInsert: { key, value } },
        { upsert: true },
      ),
    ),
  );
}
