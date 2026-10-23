import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";

async function promptPasswordHidden(): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write("Enter staff password: ");
    let password = "";
    const onData = (char: Buffer) => {
      const str = char.toString("utf8");
      for (let i = 0; i < str.length; i++) {
        const c = str[i];
        if (c === "\n" || c === "\r" || c === "\u0004") {
          process.stdin.removeListener("data", onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          resolve(password.trim());
          return;
        } else if (c === "\u0003") {
          process.stdin.removeListener("data", onData);
          if (process.stdin.isTTY) process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write("\n");
          process.exit(1);
        } else if (c === "\b" || c === "\x7f") {
          if (password.length > 0) password = password.slice(0, -1);
        } else {
          password += c;
        }
      }
    };
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function provisionStaff() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith("--email="))?.split("=")[1]?.trim();
  const nameArg = args.find((a) => a.startsWith("--name="))?.split("=")[1]?.trim() ?? "Staff Admin";
  const roleArg = args.find((a) => a.startsWith("--role="))?.split("=")[1]?.trim() ?? "admin";

  if (!emailArg) {
    console.error("Usage: node --experimental-strip-types scripts/provision-staff.ts --email=admin@example.com [--name='Admin Name'] [--role=admin|editor]");
    console.error("Set STAFF_PASSWORD environment variable or enter password when prompted.");
    process.exit(1);
  }

  if (roleArg !== "admin" && roleArg !== "editor") {
    console.error("Role must be 'admin' or 'editor'");
    process.exit(1);
  }

  let password = process.env.STAFF_PASSWORD?.trim();
  if (!password) {
    password = await promptPasswordHidden();
  }

  if (!password || password.length < 8) {
    console.error("Password must be at least 8 characters long.");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL must be set to provision staff.");
    process.exit(1);
  }

  console.log(`Provisioning staff account for email: ${emailArg} with role: ${roleArg}`);

  const pool = new Pool({ connectionString: databaseUrl });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check if user already exists
    const userRes = await client.query<{ id: string }>(
      'SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [emailArg]
    );

    let userId: string;
    const passwordHash = await hashPassword(password);

    if (userRes.rows[0]) {
      userId = userRes.rows[0].id;
      console.log(`Found existing user account ID: ${userId}`);

      // Update or insert credential account
      const accountRes = await client.query<{ id: string }>(
        'SELECT id FROM "account" WHERE "userId" = $1 AND "providerId" = \'credential\' LIMIT 1',
        [userId]
      );

      if (accountRes.rows[0]) {
        await client.query(
          'UPDATE "account" SET "password" = $1, "updatedAt" = now() WHERE id = $2',
          [passwordHash, accountRes.rows[0].id]
        );
        console.log("Updated password for credential account.");
      } else {
        await client.query(
          'INSERT INTO "account" (id, "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") VALUES ($1, $2, \'credential\', $3, $4, now(), now())',
          [crypto.randomUUID(), emailArg, userId, passwordHash]
        );
        console.log("Added credential account for existing user.");
      }
    } else {
      userId = crypto.randomUUID();
      await client.query(
        'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, now(), now())',
        [userId, nameArg, emailArg.toLowerCase()]
      );

      await client.query(
        'INSERT INTO "account" (id, "accountId", "providerId", "userId", "password", "createdAt", "updatedAt") VALUES ($1, $2, \'credential\', $3, $4, now(), now())',
        [crypto.randomUUID(), emailArg, userId, passwordHash]
      );
      console.log(`Created new user ID: ${userId}`);
    }

    // Provision staff role according to exact staff_member schema (user_id, role, granted_by, created_at)
    const staffRes = await client.query<{ user_id: string }>(
      'SELECT user_id FROM staff_member WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    if (staffRes.rows[0]) {
      await client.query(
        'UPDATE staff_member SET role = $1 WHERE user_id = $2',
        [roleArg, userId]
      );
      console.log(`Updated staff member role to '${roleArg}'`);
    } else {
      await client.query(
        'INSERT INTO staff_member (user_id, role, granted_by, created_at) VALUES ($1, $2, $3, now())',
        [userId, roleArg, "cli-provision"]
      );
      console.log(`Assigned staff member role '${roleArg}'`);
    }

    await client.query("COMMIT");
    console.log(`Staff provisioning completed successfully for ${emailArg}.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

provisionStaff().catch((err) => {
  console.error("Error provisioning staff:", err);
  process.exit(1);
});
