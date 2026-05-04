import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getDB } from '../db';

export interface ExportOptions {
  docType:          'summary' | 'statement';
  includeMood:      boolean;
  includeTriggers:  boolean;
  includeGrounding: boolean;
  includeNotes:     boolean;
  userNotes:        string;
  name:             string;
  role:             string;
  days:             30 | 60 | 90;
}

interface ExportData {
  moodRows:     { created_at: number; mood: number; energy: number; sleep: number; slot: string }[];
  triggerRows:  { created_at: number; event: string; reaction: string; intensity: number; note: string | null }[];
  groundingRows:{ created_at: number; type: string; duration_s: number }[];
  since:        number;
  now:          number;
  dateRange:    string;
}

// Module-level cache so the preview screen can read the HTML without a second DB query.
// Fully in-memory — no network, no disk — safe for offline and deployed environments.
let _html = '';
export const htmlCache = {
  set(html: string) { _html = html; },
  get(): string     { return _html; },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function moodLabel(val: number): string {
  return ['Rough', 'Low', 'Okay', 'Good', 'Solid'][Math.min(4, Math.max(0, Math.round(val)))] ?? '—';
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmt(val: number | null, dec = 1): string {
  return val === null ? '—' : val.toFixed(dec);
}

// ─── DB fetch ────────────────────────────────────────────────────────────────

async function fetchData(opts: ExportOptions): Promise<ExportData> {
  const db    = await getDB();
  const since = daysAgo(opts.days);
  const now   = Date.now();

  const moodRows = await db.getAllAsync<{
    created_at: number; mood: number; energy: number; sleep: number; slot: string;
  }>(
    `SELECT created_at, mood, energy, sleep, slot FROM mood_entries WHERE created_at >= ? ORDER BY created_at ASC`,
    [since],
  );

  const triggerRows = await db.getAllAsync<{
    created_at: number; event: string; reaction: string; intensity: number; note: string | null;
  }>(
    `SELECT created_at, event, reaction, intensity, note FROM trigger_logs WHERE created_at >= ? ORDER BY created_at DESC`,
    [since],
  );

  const groundingRows = await db.getAllAsync<{
    created_at: number; type: string; duration_s: number;
  }>(
    `SELECT created_at, type, duration_s FROM grounding_sessions WHERE created_at >= ? ORDER BY created_at DESC`,
    [since],
  );

  return {
    moodRows,
    triggerRows,
    groundingRows,
    since,
    now,
    dateRange: `${formatDate(since)} – ${formatDate(now)}`,
  };
}

// ─── Shared HTML fragments ───────────────────────────────────────────────────

function docHeader(opts: ExportOptions, data: ExportData, subtitle: string): string {
  const roleLabel = opts.role === 'veteran' ? 'Veteran' : 'Currently Serving — U.S. Military';
  return `
    <div class="doc-header">
      <div class="app-name">RallyZone</div>
      <div class="doc-subtitle">${subtitle}</div>
      <div class="doc-role">${roleLabel}</div>
      <div class="doc-meta">
        <div class="doc-meta-item"><strong>Name:</strong> ${opts.name || 'Not provided'}</div>
        <div class="doc-meta-item"><strong>Period:</strong> ${data.dateRange}</div>
        <div class="doc-meta-item"><strong>Generated:</strong> ${formatDate(data.now)}</div>
      </div>
    </div>
  `;
}

const NOTICE_HTML = `
  <div class="notice">
    <div class="notice-title">Important Notice</div>
    <div class="notice-body">
      RallyZone is a personal wellness application intended to support the mental health and emotional
      regulation of veterans and high-stress individuals. It is <strong>not affiliated with, endorsed by,
      or approved by the Department of Veterans Affairs (VA)</strong> or any other government agency.<br/><br/>
      This document is <strong>not a VA form</strong> and does not constitute a medical or legal record.
      It is a personal wellness document generated locally on the user's device, intended solely as
      supporting documentation that the user may choose to share with their VA provider, VSO, or care
      team at their own discretion. The user is solely responsible for any decision to submit this
      document to the VA or any other entity.<br/><br/>
      <strong>All data was entered by the user and stored locally on their device.
      No data was transmitted to any server at any time.</strong>
    </div>
  </div>
`;

const FOOTER_HTML = `
  <div class="footer">
    Generated locally using RallyZone by LyfieldCreationsOS. RallyZone is not affiliated with or endorsed
    by the Department of Veterans Affairs. This document is not a VA form and does not constitute a medical
    or legal record. It is a personal wellness document intended as supporting documentation at the sole
    discretion of the user. All data was entered by the user and stored locally on their device.
    No data was transmitted to any server. The user is solely responsible for any decision to submit
    this document to the VA or any other entity.
  </div>
`;

// ─── Shared CSS ──────────────────────────────────────────────────────────────

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1A18; background: #fff; padding: 40px; font-size: 13px; }

  .doc-header { margin-bottom: 24px; padding-bottom: 18px; border-bottom: 3px solid #1A1A18; }
  .app-name   { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .doc-subtitle { font-size: 13px; color: #5F5E5A; margin-top: 2px; }
  .doc-role   { display: inline-block; margin-top: 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #fff; background: #1A1A18; padding: 3px 10px; border-radius: 4px; }
  .doc-meta   { display: flex; gap: 32px; margin-top: 14px; flex-wrap: wrap; }
  .doc-meta-item { font-size: 11px; color: #5F5E5A; }
  .doc-meta-item strong { color: #1A1A18; font-weight: 600; }

  .notice       { background: #FDF8EC; border: 1.5px solid #D4A843; border-radius: 8px; padding: 14px 16px; margin-bottom: 28px; }
  .notice-title { font-size: 10px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #8A6A1A; margin-bottom: 8px; }
  .notice-body  { font-size: 11px; color: #5A4A1A; line-height: 1.7; }

  .section       { margin-bottom: 28px; }
  .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #5F5E5A; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E0DFD8; }

  .stat-grid  { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-box   { background: #F5F4F0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888780; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; color: #1A1A18; }
  .stat-sub   { font-size: 10px; color: #888780; margin-top: 2px; }

  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th    { background: #F5F4F0; padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #5F5E5A; }
  td    { padding: 8px 10px; border-bottom: 1px solid #F5F4F0; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .table-note { font-size: 10px; color: #888780; margin-top: 8px; font-style: italic; }

  .prose      { font-size: 12px; color: #1A1A18; line-height: 1.8; margin-bottom: 16px; }
  .quote-box  { background: #F5F4F0; border-radius: 8px; padding: 14px; font-size: 13px; color: #1A1A18; line-height: 1.75; }

  .sig-block  { margin-top: 32px; padding: 20px; border: 1px solid #E0DFD8; border-radius: 8px; }
  .sig-label  { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #5F5E5A; margin-bottom: 20px; }
  .sig-row    { display: flex; gap: 40px; margin-bottom: 32px; }
  .sig-field  { flex: 1; }
  .sig-line   { border-bottom: 1px solid #1A1A18; margin-bottom: 4px; height: 28px; }
  .sig-desc   { font-size: 10px; color: #888780; }
  .sig-cert   { font-size: 11px; color: #5F5E5A; line-height: 1.6; margin-bottom: 20px; }

  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E0DFD8; font-size: 10px; color: #B4B2A9; line-height: 1.7; }
`;

function wrapHTML(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${BASE_CSS}</style></head><body>${body}</body></html>`;
}

// ─── Summary document ────────────────────────────────────────────────────────

function buildSummaryHTML(opts: ExportOptions, data: ExportData): string {
  const { moodRows, triggerRows, groundingRows } = data;

  const moods    = moodRows.map(r => r.mood);
  const energies = moodRows.map(r => r.energy);
  const sleeps   = moodRows.map(r => r.sleep);
  const avgMood   = avg(moods);
  const avgEnergy = avg(energies);
  const avgSleep  = avg(sleeps);
  const moodCounts = [0, 0, 0, 0, 0];
  for (const m of moods) moodCounts[Math.min(4, Math.max(0, Math.round(m)))]++;

  const highTriggers = triggerRows.filter(r => r.intensity >= 7).length;
  const avgIntensity = avg(triggerRows.map(r => r.intensity));

  const moodSection = opts.includeMood ? `
    <div class="section">
      <div class="section-title">Mood, Energy &amp; Sleep</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Avg Mood</div>
          <div class="stat-value">${fmt(avgMood)} / 4</div>
          <div class="stat-sub">${avgMood !== null ? moodLabel(avgMood) : '—'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Energy</div>
          <div class="stat-value">${fmt(avgEnergy)} / 4</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Sleep</div>
          <div class="stat-value">${fmt(avgSleep)} / 4</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Check-ins</div>
          <div class="stat-value">${moodRows.length}</div>
          <div class="stat-sub">${moodRows.filter(r => r.slot === 'am').length} AM · ${moodRows.filter(r => r.slot === 'pm').length} PM</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Mood Level</th><th>Days Recorded</th></tr></thead>
        <tbody>
          ${['Rough', 'Low', 'Okay', 'Good', 'Solid'].map((l, i) =>
            `<tr><td>${l}</td><td>${moodCounts[i]}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>` : '';

  const triggerSection = opts.includeTriggers && triggerRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Trigger Log</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Total Entries</div>
          <div class="stat-value">${triggerRows.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Intensity</div>
          <div class="stat-value">${fmt(avgIntensity)} / 10</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">High Intensity (7+)</div>
          <div class="stat-value">${highTriggers}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>Date</th><th>Event</th><th>Reaction</th><th>Intensity</th></tr></thead>
        <tbody>
          ${triggerRows.slice(0, 20).map(r => `
            <tr>
              <td>${formatDate(r.created_at)}</td>
              <td>${r.event}</td>
              <td>${r.reaction}</td>
              <td>${r.intensity} / 10</td>
            </tr>`).join('')}
        </tbody>
      </table>
      ${triggerRows.length > 20 ? `<p class="table-note">Showing 20 most recent of ${triggerRows.length} entries.</p>` : ''}
    </div>` : '';

  const groundingSection = opts.includeGrounding && groundingRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Calm Toolkit Usage</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Total Sessions</div>
          <div class="stat-value">${groundingRows.length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Avg Duration</div>
          <div class="stat-value">${avg(groundingRows.map(r => r.duration_s)) !== null ? Math.round(avg(groundingRows.map(r => r.duration_s))!) + 's' : '—'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Breathing</div>
          <div class="stat-value">${groundingRows.filter(r => r.type === 'breathing').length}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Grounding</div>
          <div class="stat-value">${groundingRows.filter(r => r.type === 'grounding').length}</div>
        </div>
      </div>
    </div>` : '';

  const notesSection = opts.includeNotes && opts.userNotes.trim() ? `
    <div class="section">
      <div class="section-title">Personal Statement</div>
      <div class="quote-box">${opts.userNotes.trim().replace(/\n/g, '<br/>')}</div>
    </div>` : '';

  const body = `
    ${docHeader(opts, data, 'Personal Wellness Summary — Supporting Document')}
    ${NOTICE_HTML}
    ${moodSection}
    ${triggerSection}
    ${groundingSection}
    ${notesSection}
    ${FOOTER_HTML}
  `;
  return wrapHTML(body);
}

// ─── Personal Statement document ─────────────────────────────────────────────

function moodNarrative(avgMood: number | null): string {
  if (avgMood === null) return 'Mood data was not recorded during this period.';
  if (avgMood < 2)
    return `My average recorded mood of ${avgMood.toFixed(1)}/4 reflects persistent emotional difficulty and reduced daily functioning during this period — consistent with the ongoing impact of service-connected conditions on my mental health.`;
  if (avgMood < 3)
    return `My average recorded mood of ${avgMood.toFixed(1)}/4 indicates ongoing challenges with emotional regulation that routinely affected my ability to function day to day, even with active self-management efforts.`;
  return `My average recorded mood of ${avgMood.toFixed(1)}/4 reflects periods of improved functioning achieved through consistent self-management. This was not effortless — it required daily, deliberate effort to maintain, and challenges persisted throughout this period.`;
}

function triggerNarrative(count: number, avgInt: number | null, highCount: number): string {
  if (count === 0) return 'No stressor events were logged during this period.';
  const intensity = avgInt !== null ? avgInt.toFixed(1) : '—';
  const highPhrase = highCount > 0
    ? ` Of these, ${highCount} event${highCount > 1 ? 's were' : ' was'} rated 7 or higher, indicating significant disruption to my daily functioning.`
    : '';
  return `I documented ${count} stress or trigger event${count > 1 ? 's' : ''} during this period, with an average recorded intensity of ${intensity}/10.${highPhrase} The frequency and severity of these events are consistent with the ongoing impact of service-connected stress responses on my daily life.`;
}

function groundingNarrative(sessions: number, breathing: number, grounding: number): string {
  if (sessions === 0) return '';
  return `Despite these documented challenges, I completed ${sessions} structured self-regulation session${sessions > 1 ? 's' : ''} — ${breathing} breathing exercise${breathing !== 1 ? 's' : ''} and ${grounding} grounding exercise${grounding !== 1 ? 's' : ''}. This consistent engagement with evidence-based coping techniques reflects both the severity of my symptoms and my ongoing, proactive commitment to managing them.`;
}

function buildStatementHTML(opts: ExportOptions, data: ExportData): string {
  const { moodRows, triggerRows, groundingRows } = data;
  const roleLabel  = opts.role === 'veteran' ? 'a U.S. Veteran' : 'an Active Member of the U.S. Military';
  const roleFormal = opts.role === 'veteran' ? 'Veteran' : 'Service Member';

  const avgMood    = avg(moodRows.map(r => r.mood));
  const avgEnergy  = avg(moodRows.map(r => r.energy));
  const avgSleep   = avg(moodRows.map(r => r.sleep));
  const avgInt     = avg(triggerRows.map(r => r.intensity));
  const highTrig   = triggerRows.filter(r => r.intensity >= 7).length;
  const breathSess = groundingRows.filter(r => r.type === 'breathing').length;
  const groundSess = groundingRows.filter(r => r.type === 'grounding').length;

  const moodBlock = moodRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Mood and Daily Functioning</div>
      <p class="prose">
        During this period, I completed ${moodRows.length} mood check-in${moodRows.length !== 1 ? 's' : ''}
        tracking my mood, energy, and sleep on a daily basis.
        ${moodNarrative(avgMood)}
        ${avgEnergy !== null ? `My average energy level was ${avgEnergy.toFixed(1)}/4 and my average sleep quality was ${avgSleep !== null ? avgSleep.toFixed(1) : '—'}/4,` : ''}
        ${(avgEnergy !== null && avgEnergy < 2.5) || (avgSleep !== null && avgSleep < 2.5)
          ? 'reflecting the ongoing toll that service-connected conditions continue to place on my physical and emotional functioning.'
          : avgEnergy !== null ? 'both of which required consistent effort to maintain throughout this period.' : ''}
      </p>
    </div>` : '';

  const triggerBlock = triggerRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Documented Stress and Trigger Events</div>
      <p class="prose">${triggerNarrative(triggerRows.length, avgInt, highTrig)}</p>
    </div>` : '';

  const groundingBlock = groundingRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Active Self-Management Efforts</div>
      <p class="prose">${groundingNarrative(groundingRows.length, breathSess, groundSess)}</p>
    </div>` : '';

  const personalBlock = opts.userNotes.trim() ? `
    <div class="section">
      <div class="section-title">In My Own Words</div>
      <div class="quote-box">${opts.userNotes.trim().replace(/\n/g, '<br/>')}</div>
    </div>` : '';

  const body = `
    ${docHeader(opts, data, 'Personal Wellness Statement — Supporting Document')}
    ${NOTICE_HTML}

    <div class="section">
      <div class="section-title">Statement</div>
      <p class="prose">
        I, <strong>${opts.name}</strong>, am ${roleLabel} and submit this personal wellness statement
        as corroborating documentation in connection with my service-connected benefit claim.
        The information below reflects real-time data I recorded during the period from
        <strong>${data.dateRange}</strong>, representing an accurate and contemporaneous account
        of my mental health, stress responses, and daily functioning during that time.
        All data was recorded by me and stored locally on my personal device.
      </p>
    </div>

    ${moodBlock}
    ${triggerBlock}
    ${groundingBlock}
    ${personalBlock}

    <div class="sig-block">
      <div class="sig-label">Certification &amp; Signature</div>
      <p class="sig-cert">
        I certify that the information contained in this statement is true and accurate to the best of
        my knowledge and belief. I understand this document may be submitted as personal supporting
        documentation in connection with a VA benefit claim. I am solely responsible for its content
        and any decision to submit it.
      </p>
      <div class="sig-row">
        <div class="sig-field">
          <div class="sig-line"></div>
          <div class="sig-desc">Signature of ${roleFormal}</div>
        </div>
        <div class="sig-field" style="max-width: 200px;">
          <div class="sig-line"></div>
          <div class="sig-desc">Date Signed</div>
        </div>
      </div>
      <div class="sig-row" style="margin-bottom: 0;">
        <div class="sig-field">
          <div class="sig-line"></div>
          <div class="sig-desc">Printed Name — ${opts.name}</div>
        </div>
      </div>
    </div>

    ${FOOTER_HTML}
  `;
  return wrapHTML(body);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function buildHTML(opts: ExportOptions, data: ExportData): string {
  return opts.docType === 'statement'
    ? buildStatementHTML(opts, data)
    : buildSummaryHTML(opts, data);
}

export async function prepareHTML(opts: ExportOptions): Promise<string> {
  const data = await fetchData(opts);
  const html = buildHTML(opts, data);
  htmlCache.set(html);
  return html;
}

export async function generateAndSharePDF(opts: ExportOptions): Promise<void> {
  const html = await prepareHTML(opts);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType:    'application/pdf',
      dialogTitle: 'Share Wellness Document',
      UTI:         'com.adobe.pdf',
    });
  }
}
