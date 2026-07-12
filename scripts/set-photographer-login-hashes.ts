import { eq } from "drizzle-orm";
import { db } from "@/db";
import { persons } from "@/db/schema";
import { createLoginHash } from "@/lib/login-hash";

async function main() {
  const photographers = await db
    .select({
      id: persons.id,
      name: persons.name,
      loginHash: persons.loginHash,
    })
    .from(persons)
    .where(eq(persons.type, "photographer"));

  if (photographers.length === 0) {
    console.log("No photographers found.");
    return;
  }

  for (const photographer of photographers) {
    if (photographer.loginHash) {
      console.log(
        `[skip] #${photographer.id} ${photographer.name} — already has login hash`,
      );
      continue;
    }

    const loginHash = createLoginHash();
    await db
      .update(persons)
      .set({ loginHash })
      .where(eq(persons.id, photographer.id));

    console.log(
      `[set] #${photographer.id} ${photographer.name}\n      /photographers/${photographer.id}?loginHash=${loginHash}`,
    );
  }
}

void main();
