import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('Missing DATABASE_URL env. Example: postgres://user:pass@localhost:5432/sih2025');
		process.exit(1);
	}
	const schemaPath = path.resolve(__dirname, '../sql/schema.sql');
	const sql = fs.readFileSync(schemaPath, 'utf8');
	const client = new Client({ connectionString: databaseUrl, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false });
	await client.connect();
	try {
		await client.query(sql);
		console.log('Schema applied successfully.');
	} finally {
		await client.end();
	}
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
