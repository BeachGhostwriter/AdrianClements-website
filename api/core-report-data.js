import { getPool, verifySession, parseCookies, COOKIE_NAME } from './core-auth-lib.js';

const DEMO_CLIENT = { slug: 'demo', name: 'Hydreatio Group (Demo)' };

// Exact figures from the reporting prototype — served whenever no client
// slug is requested, or the requested client has no rows in risk_register.
const DEMO_RISKS = [
  { name: 'Commodity Exposure (Ni/Cr)', category: 'Commodity', tts: 71.4, velocity: 4.8, acceleration: 0.61, phaseIndex: 2.14, freedomIndex: 38, urgencyRank: 1, owner: 'CFO Office', nextReview: '10 Jul', trend: 'up' },
  { name: 'Supply-Chain Concentration', category: 'Supply Chain', tts: 44.8, velocity: 2.1, acceleration: 0.24, phaseIndex: 1.32, freedomIndex: 52, urgencyRank: 2, owner: 'COO Office', nextReview: '10 Jul', trend: 'up' },
  { name: 'Cyber — Third-Party Access', category: 'Cyber', tts: 38.2, velocity: 0.4, acceleration: 0.02, phaseIndex: 0.71, freedomIndex: 66, urgencyRank: 4, owner: 'CISO', nextReview: '17 Jul', trend: 'flat' },
  { name: 'Regulatory — EU CBAM Phase-in', category: 'Regulatory', tts: 22.1, velocity: -0.3, acceleration: -0.05, phaseIndex: 0.44, freedomIndex: 74, urgencyRank: 5, owner: 'Compliance', nextReview: '24 Jul', trend: 'down' },
  { name: 'Talent Attrition — Engineering', category: 'People', tts: 11.6, velocity: 0.1, acceleration: 0.00, phaseIndex: 0.18, freedomIndex: 88, urgencyRank: 6, owner: 'CHRO', nextReview: '31 Jul', trend: 'flat' },
  { name: 'Geopolitical — Logistics Corridor', category: 'Geopolitical', tts: 9.3, velocity: -0.2, acceleration: -0.01, phaseIndex: 0.12, freedomIndex: 91, urgencyRank: 3, owner: 'COO Office', nextReview: '17 Jul', trend: 'down' },
];

const DEMO_FREEDOM_INDEX_GROUP = 73;

const DEMO_MILESTONES = {
  title: 'Commodity Exposure',
  items: [
    { date: 'defined 2027', text: 'Ni/Cr basket hedged to 65% of stainless volume; parent TTS ceiling held under 25.' },
    { date: 'Q1 2027', text: 'Hedging facility live; stainless division cost base decoupled from spot swings.' },
    { date: 'Q3 2026', text: 'Spinoff structure ratified; independent risk appetite statement published.' },
    { date: 'now', text: 'Phase Index breach — this is the milestone in question this cycle.' },
  ],
};

const DEMO_SPECIALIST = {
  illustrative: true,
  ccordNote: 'Diamond boundary |U|+|V|=1 · origin (0,0) · axes: risk↔opportunity (horiz.), RiskTime (vert., future up) · horizons: tanh, bowing toward past at magnitude',
  monteCarlo: { medianForwardTts: 96.2, bandLow: 71.4, bandHigh: 118.9, probExceedAppetite: 0.34 },
  coherenceScore: 1.28,
  entropy: [
    { node: 'Commodity node', value: 0.41, trend: 'down' },
    { node: 'Supply-chain node', value: 0.63, trend: 'flat' },
  ],
  palmerNoise: 0.087,
  calibration: { alpha: 0.62, beta: 0.24, gamma: 0.14, psiC: 2.00, vMax: 6.50 },
};

function zoneColor(tts) {
  if (tts > 60) return { hex: '#B0453A', pill: 'red' };
  if (tts > 35) return { hex: '#C98A2C', pill: 'orange' };
  if (tts > 18) return { hex: '#D9C25A', pill: 'yellow' };
  return { hex: '#4C9A6E', pill: 'green' };
}

function trendLabel(trend) {
  if (trend === 'up') return { symbol: '▲', word: 'rising' };
  if (trend === 'down') return { symbol: '▼', word: 'easing' };
  return { symbol: '—', word: 'stable' };
}

function buildActionLine(risks) {
  const ranked = [...risks].filter((r) => r.urgencyRank != null).sort((a, b) => a.urgencyRank - b.urgencyRank);
  if (ranked.length === 0) return 'No urgency-ranked risks on file for this client yet.';
  const top = ranked.slice(0, 2).map((r) => r.name);
  if (top.length === 1) {
    return `Urgency ranking puts <b>${top[0]}</b> ahead of everything else for Exco time this cycle.`;
  }
  return `Urgency ranking (not severity ranking) puts <b>${top[0]}</b> and <b>${top[1]}</b> ahead of everything else for Exco time — check whether either is also your highest-impact line, or whether urgency and severity have diverged this cycle.`;
}

function buildAlert(risks, psiC) {
  const breach = [...risks]
    .filter((r) => r.phaseIndex != null && r.phaseIndex >= psiC)
    .sort((a, b) => b.phaseIndex - a.phaseIndex)[0];
  if (!breach) return null;
  return {
    riskName: breach.name,
    text: `<b>Phase Alert — ${breach.name}.</b> Phase Index crossed ${psiC.toFixed(1)} this cycle: the risk is approaching a tipping point faster than its severity score alone would suggest. Recommend FORGE© handoff review at next Exco.`,
  };
}

function buildUrgencySchedule(risks) {
  const ranked = [...risks].filter((r) => r.urgencyRank != null).sort((a, b) => a.urgencyRank - b.urgencyRank).slice(0, 3);
  return ranked.map((r) => {
    const t = trendLabel(r.trend);
    const blurb =
      r.trend === 'up'
        ? `velocity positive, escalation not yet critical.`
        : r.trend === 'down'
        ? `deprioritised this cycle; freedom index high and easing.`
        : `holding steady; monitor for the next review.`;
    return { rank: r.urgencyRank, name: r.name, text: `${r.name} — ${blurb}` };
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers.cookie);
  const authedEmail = process.env.CORE_AUTH_SECRET ? verifySession(cookies[COOKIE_NAME]) : null;
  if (!authedEmail) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const requestedSlug = String(req.query?.client || 'demo').trim().toLowerCase();

  let availableClients = [DEMO_CLIENT];
  let clientRisks = null;
  let clientName = null;

  const dbUrl =
    process.env.CORE_DATABASE_URL ||
    process.env.core_database_DATABASE_URL ||
    process.env.Core_database_url;

  if (dbUrl) {
    try {
      const pool = getPool();
      const clientsResult = await pool.query(
        'SELECT DISTINCT client_slug, client_name FROM risk_register ORDER BY client_name'
      );
      availableClients = [
        DEMO_CLIENT,
        ...clientsResult.rows.map((r) => ({ slug: r.client_slug, name: r.client_name })),
      ];

      if (requestedSlug !== 'demo') {
        const rowsResult = await pool.query(
          'SELECT client_name, risk_name, category, tts, velocity, acceleration, phase_index, freedom_index, urgency_rank, owner, next_review, trend FROM risk_register WHERE client_slug = $1 ORDER BY tts DESC',
          [requestedSlug]
        );
        if (rowsResult.rows.length > 0) {
          clientName = rowsResult.rows[0].client_name;
          clientRisks = rowsResult.rows.map((r) => ({
            name: r.risk_name,
            category: r.category,
            tts: Number(r.tts),
            velocity: r.velocity != null ? Number(r.velocity) : null,
            acceleration: r.acceleration != null ? Number(r.acceleration) : null,
            phaseIndex: r.phase_index != null ? Number(r.phase_index) : null,
            freedomIndex: r.freedom_index != null ? Number(r.freedom_index) : null,
            urgencyRank: r.urgency_rank,
            owner: r.owner,
            nextReview: r.next_review
              ? new Date(r.next_review).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
              : null,
            trend: r.trend || 'flat',
          }));
        }
      }
    } catch (err) {
      // risk_register doesn't exist yet, or a query failed — fall back to demo below.
      if (err.code !== '42P01') console.error('CORE report-data error:', err);
    }
  }

  const isClientData = !!clientRisks;
  const risks = isClientData ? clientRisks : DEMO_RISKS;
  const risksWithZone = risks.map((r) => ({ ...r, zone: zoneColor(r.tts), trendLabel: trendLabel(r.trend) }));

  const freedomIndexGroup = isClientData
    ? Math.round(
        risks.filter((r) => r.freedomIndex != null).reduce((sum, r) => sum + r.freedomIndex, 0) /
          Math.max(1, risks.filter((r) => r.freedomIndex != null).length)
      )
    : DEMO_FREEDOM_INDEX_GROUP;

  return res.status(200).json({
    source: isClientData ? 'client' : 'demo',
    clientSlug: isClientData ? requestedSlug : 'demo',
    clientName: isClientData ? clientName : DEMO_CLIENT.name,
    snapshotAt: new Date().toISOString(),
    availableClients,
    risks: risksWithZone,
    freedomIndexGroup,
    alert: buildAlert(risks, DEMO_SPECIALIST.calibration.psiC),
    actionLine: buildActionLine(risks),
    milestones: DEMO_MILESTONES,
    urgencySchedule: buildUrgencySchedule(risks),
    specialist: DEMO_SPECIALIST,
  });
}
