import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { ModelConfig } from "../models/ModelConfig.js";
import { ensureDefaultSettings } from "./settings.js";

const defaults = [
  {
    email: "babarmeetadmin@gmail.com",
    password: "babarmeetadmin@pass",
    role: "admin",
  },
  { email: "babarmeetpaid@gmail.com", password: "BabarMeet123", role: "paid" },
  { email: "babarmeetfree@gmail.com", password: "BabarMeet123", role: "free" },
];

export async function seedDefaults() {
  for (const item of defaults) {
    const exists = await User.findOne({ email: item.email });
    if (exists) continue;

    const passwordHash = await bcrypt.hash(item.password, 10);
    await User.create({ email: item.email, passwordHash, role: item.role });
  }

  await ModelConfig.updateOne(
    { modelId: "gpt-oss:20b" },
    {
      $setOnInsert: {
        name: "Ollama GPT OSS 20B",
        modelId: "gpt-oss:20b",
        provider: "ollama",
        enabled: true,
        allowGuest: true,
        allowFree: true,
        allowPaid: true,
      },
    },
    { upsert: true },
  );

  await ensureDefaultSettings();
}
