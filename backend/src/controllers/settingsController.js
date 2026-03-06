import { DEFAULT_SETTINGS } from "../utils/constants.js";
import { getSetting, setSetting } from "../services/settings.js";

export async function getSettings(req, res, next) {
  try {
    const comparisonLimit = await getSetting(
      "comparisonLimit",
      DEFAULT_SETTINGS.comparisonLimit,
    );
    const promptScoringModel = await getSetting(
      "promptScoringModel",
      DEFAULT_SETTINGS.promptScoringModel,
    );
    const guestDefaultModelId = await getSetting(
      "guestDefaultModelId",
      DEFAULT_SETTINGS.guestDefaultModelId,
    );
    const playgroundDefaults = await getSetting(
      "playgroundDefaults",
      DEFAULT_SETTINGS.playgroundDefaults,
    );
    res.json({
      comparisonLimit,
      promptScoringModel,
      guestDefaultModelId,
      playgroundDefaults,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const keys = [
      "comparisonLimit",
      "promptScoringModel",
      "guestDefaultModelId",
      "playgroundDefaults",
    ];
    for (const key of keys) {
      if (req.body[key] !== undefined) {
        await setSetting(key, req.body[key]);
      }
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
