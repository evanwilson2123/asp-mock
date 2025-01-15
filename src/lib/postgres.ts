import { Pool } from "pg";

// Get the database URL env var
const postgresUri = process.env.DATABASE_URL;

if (!postgresUri) {
  throw new Error("POSTGRES_URL is not defined");
}

// Create a connection pool
export const pool = new Pool({
  connectionString: postgresUri,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Helper function for PostgreSQL queries
export const query = async (text: string, params?: any[]) => {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (error: any) {
    console.error(error);
    throw error;
  } finally {
    client.release();
  }
};
