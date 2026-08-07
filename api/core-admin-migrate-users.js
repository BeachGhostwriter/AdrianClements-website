import { getPool } from './core-auth-lib.js';

const EMAILS = ['adrian.m.clements@outlook.com', 'adrian.m.clements+demo@outlook.com'];

export default async function handler(req, res) {
  const token = req.headers['x-migration-token'];
  if (!process.env.MIGRATION_TOKEN3 || token !== process.env.MIGRATION_TOKEN3) {
    return res.status(401).json({ error: 'Not authorized.' });
  }
  try {
    const pool = getPool();

    await pool.query(`
      INSERT INTO "BusinessUnit" (id, name, code, "group", region, "isActive", "createdAt", "updatedAt")
      VALUES ('bu-demo-001', 'Demo Organisation', 'DEMO', 'Hydreatio', 'Europe', true, now(), now())
      ON CONFLICT (code) DO NOTHING;
    `);

    const insertUsers = await pool.query(
      `
      INSERT INTO "User" (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt")
      SELECT md5(random()::text || email), email, password_hash,
        CASE WHEN email LIKE '%+demo%' THEN 'Adrian Clements (Demo)' ELSE 'Adrian Clements' END,
        'ADMIN'::"UserRole", true, now(), now()
      FROM core_users
      WHERE lower(email) = ANY(SELECT lower(unnest($1::text[])))
      ON CONFLICT (email) DO NOTHING
      RETURNING email;
      `,
      [EMAILS]
    );

    await pool.query(`
      INSERT INTO "BusinessUnitMember" (id, "userId", "businessUnitId", "isCEO", "isRiskCoordinator", "createdAt")
      SELECT md5(random()::text || u.email), u.id, bu.id, false, true, now()
      FROM "User" u, "BusinessUnit" bu
      WHERE lower(u.email) = ANY(SELECT lower(unnest($1::text[]))) AND bu.code = 'DEMO'
      ON CONFLICT ("userId", "businessUnitId") DO NOTHING;
    `, [EMAILS]);

    await pool.query(`
      INSERT INTO "Parameters" (id, "businessUnitId", "reportingPeriod", "updatedAt")
      SELECT 'params-demo-001', id, '2026Q2', now() FROM "BusinessUnit" WHERE code = 'DEMO'
      ON CONFLICT ("businessUnitId") DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO "Calibration" (id, "businessUnitId", "reportingPeriod", "timeHorizon", "updatedAt")
      SELECT 'calib-demo-001', id, '2026Q2', 'next 3 - 5 years', now() FROM "BusinessUnit" WHERE code = 'DEMO'
      ON CONFLICT ("businessUnitId") DO NOTHING;
    `);

    const check = await pool.query(
      'SELECT email, role FROM "User" WHERE lower(email) = ANY(SELECT lower(unnest($1::text[])))',
      [EMAILS]
    );
    const coreUsersMatch = await pool.query(
      'SELECT count(*)::int AS n FROM core_users WHERE lower(email) = ANY(SELECT lower(unnest($1::text[])))',
      [EMAILS]
    );

    return res.status(200).json({
      ok: true,
      usersCopiedThisRun: insertUsers.rows.map((r) => r.email),
      usersNowPresent: check.rows,
      coreUsersMatchingCount: coreUsersMatch.rows[0].n,
    });
  } catch (err) {
    console.error('User migration error:', err);
    return res.status(500).json({ error: err.message, code: err.code });
  }
}
