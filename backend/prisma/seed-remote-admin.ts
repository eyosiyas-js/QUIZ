// Seed admin user into the server's PostgreSQL database
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = 'postgresql://admin:password@localhost:5433/etex_game';

async function main() {
  console.log('Connecting to:', DATABASE_URL.replace(/password/, '***'));
  
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected to PostgreSQL server.');

    // Check if admin already exists
    const existing = await client.query(
      `SELECT id, name, email, "phoneNumber", role FROM "User" WHERE role = 'ADMIN' AND "phoneNumber" = $1`,
      ['+251911111111']
    );

    if (existing.rows.length > 0) {
      console.log('Admin already exists:', existing.rows[0]);
      console.log('Updating password...');
      await client.query(
        `UPDATE "User" SET "passwordHash" = $1, name = $2 WHERE id = $3`,
        ['admin123', 'Admin User', existing.rows[0].id]
      );
      console.log('Admin password updated.');
    } else {
      console.log('No existing admin found, inserting new one...');
      const result = await client.query(
        `INSERT INTO "User" (id, name, email, "phoneNumber", role, "passwordHash", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
         RETURNING id, name, email, "phoneNumber", role`,
        ['Admin User', 'admin@insa.gov.et', '+251911111111', 'ADMIN', 'admin123']
      );
      console.log('Admin created:', result.rows[0]);
    }

    console.log('Done!');
  } catch (error: any) {
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

main();
