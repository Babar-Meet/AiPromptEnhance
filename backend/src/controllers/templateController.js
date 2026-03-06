import { PromptTemplate } from "../models/PromptTemplate.js";

export async function listTemplates(req, res, next) {
  try {
    if (req.auth.role === "free" || req.auth.role === "guest") {
      return res.status(403).json({ message: "Templates are paid feature" });
    }

    const templates = await PromptTemplate.find({
      $or: [{ isDefault: true }, { createdBy: req.auth.user._id }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(templates);
  } catch (error) {
    next(error);
  }
}

export async function createTemplate(req, res, next) {
  try {
    if (req.auth.role === "free" || req.auth.role === "guest") {
      return res.status(403).json({ message: "Templates are paid feature" });
    }

    const item = await PromptTemplate.create({
      name: String(req.body.name || "").trim(),
      description: String(req.body.description || "").trim(),
      template: String(req.body.template || "").trim(),
      variables: Array.isArray(req.body.variables) ? req.body.variables : [],
      createdBy: req.auth.user._id,
      isDefault: req.auth.role === "admin" && Boolean(req.body.isDefault),
    });

    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateTemplate(req, res, next) {
  try {
    const found = await PromptTemplate.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Template not found" });

    const isOwner = found.createdBy.toString() === req.auth.user._id.toString();
    if (req.auth.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(found, {
      name: req.body.name ?? found.name,
      description: req.body.description ?? found.description,
      template: req.body.template ?? found.template,
      variables: req.body.variables ?? found.variables,
      isDefault:
        req.auth.role === "admin"
          ? Boolean(req.body.isDefault ?? found.isDefault)
          : found.isDefault,
    });

    await found.save();
    res.json(found);
  } catch (error) {
    next(error);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const found = await PromptTemplate.findById(req.params.id);
    if (!found) return res.status(404).json({ message: "Template not found" });

    const isOwner = found.createdBy.toString() === req.auth.user._id.toString();
    if (req.auth.role !== "admin" && !isOwner) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await PromptTemplate.deleteOne({ _id: req.params.id });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
