import { ModelConfig } from "../models/ModelConfig.js";
import { modelAllowedForRole } from "../services/access.js";

export async function listModels(req, res, next) {
  try {
    const role = req.auth?.role || "guest";
    const models = await ModelConfig.find({ enabled: true })
      .sort({ createdAt: -1 })
      .lean();

    const filtered = models.filter((model) => modelAllowedForRole(model, role));
    res.json(
      filtered.map((m) => ({
        id: m._id,
        name: m.name,
        modelId: m.modelId,
        provider: m.provider,
        enabled: m.enabled,
        allowGuest: m.allowGuest,
        allowFree: m.allowFree,
        allowPaid: m.allowPaid,
      })),
    );
  } catch (error) {
    next(error);
  }
}

export async function adminListModels(req, res, next) {
  try {
    const models = await ModelConfig.find().sort({ createdAt: -1 }).lean();
    res.json(models);
  } catch (error) {
    next(error);
  }
}

export async function addModel(req, res, next) {
  try {
    const payload = {
      name: String(req.body.name || "").trim(),
      modelId: String(req.body.modelId || "").trim(),
      provider: String(req.body.provider || "")
        .trim()
        .toLowerCase(),
      apiKey: String(req.body.apiKey || "").trim(),
      customBaseUrl: String(req.body.customBaseUrl || "").trim(),
      enabled: Boolean(req.body.enabled ?? true),
      allowGuest: Boolean(req.body.allowGuest),
      allowFree: Boolean(req.body.allowFree),
      allowPaid: Boolean(req.body.allowPaid ?? true),
    };

    if (!payload.name || !payload.modelId || !payload.provider) {
      return res
        .status(400)
        .json({ message: "name, modelId, provider are required" });
    }

    const created = await ModelConfig.create(payload);
    res.status(201).json(created);
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json({ message: "Model already exists" });
    next(error);
  }
}

export async function updateModel(req, res, next) {
  try {
    const patch = { ...req.body };
    const model = await ModelConfig.findByIdAndUpdate(req.params.id, patch, {
      new: true,
    });
    if (!model) return res.status(404).json({ message: "Model not found" });
    res.json(model);
  } catch (error) {
    next(error);
  }
}

export async function deleteModel(req, res, next) {
  try {
    const deleted = await ModelConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Model not found" });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
