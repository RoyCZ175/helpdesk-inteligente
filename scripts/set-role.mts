import { config } from "dotenv";
config({ path: ".env.local" });

const { getCollection, COLLECTIONS } = await import("../lib/db.ts");
import type { Role, UserDoc } from "../lib/models/types.ts";

// Uso: npm run set:role -- alguien@empresa.com agent
async function main() {
  const [email, role] = process.argv.slice(2);
  const validRoles: Role[] = ["user", "agent", "admin"];

  if (!email || !role || !validRoles.includes(role as Role)) {
    console.error("Uso: npm run set:role -- <email> <user|agent|admin>");
    process.exit(1);
  }

  const users = await getCollection<UserDoc>(COLLECTIONS.users);
  const result = await users.updateOne({ email }, { $set: { role: role as Role } });

  if (result.matchedCount === 0) {
    console.error(`No existe ningún usuario con email "${email}". Debe registrarse primero.`);
    process.exit(1);
  }

  console.log(`✔ "${email}" ahora tiene el rol "${role}".`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error actualizando el rol:", error);
  process.exit(1);
});
