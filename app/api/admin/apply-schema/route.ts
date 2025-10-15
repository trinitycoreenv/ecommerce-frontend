export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret') || '';
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sqlPath = path.join(process.cwd(), 'render_schema.sql');
    if (!fs.existsSync(sqlPath)) {
      return NextResponse.json({ error: 'render_schema.sql not found' }, { status: 400 });
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL_RENDER;
    if (!connectionString) {
      return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 400 });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    const statements = sql
      .split(/;\s*\n/g)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await client.query(stmt);
    }

    await client.end();
    return NextResponse.json({ ok: true, applied: statements.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}