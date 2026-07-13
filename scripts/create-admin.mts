import { config } from "dotenv";
config({ path: ".env.local" });
import bcrypt from "bcryptjs";

const { getCollection, COLLECTIONS } = await import("../lib/db.ts");
import type { UserDoc } from "../lib/models/types.ts";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Administrador";

  if (!email || !password) {
    console.error("Define ADMIN_EMAIL y ADMIN_PASSWORD en .env.local antes de correr este script.");
    process.exit(1);
  }

  const users = await getCollection<UserDoc>(COLLECTIONS.users);
  const existing = await users.findOne({ email });

  if (existing) {
    await users.updateOne({ email }, { $set: { role: "admin" } });
    console.log(`✔ "${email}" ya existía, se aseguró el rol admin.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await users.insertOne({
    name,
    email,
    passwordHash,
    role: "admin",
    createdAt: new Date(),
  });

  console.log(`✔ Admin creado: ${email}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error creando el admin:", error);
  process.exit(1);
});
