import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getDB } from '../db';

export interface ExportOptions {
  includeMood:      boolean;
  includeTriggers:  boolean;
  includeGrounding: boolean;
  includeNotes:     boolean;
  userNotes:        string;
  callSign:         string;
  role:             string;
  days:             30 | 60 | 90;
}

function daysAgo(n: number): number {
  return Date.now() - n * 24 * 60 * 60 * 1000;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function moodLabel(val: number): string {
  const labels = ['Rough', 'Low', 'Okay', 'Good', 'Solid'];
  return labels[Math.min(4, Math.max(0, Math.round(val)))] ?? 'Unknown';
}

function avg(arr: number[]): number | null {
  if (!arr.length) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function fmt(val: number | null): string {
  if (val === null) return '—';
  return val.toFixed(1);
}

export async function generateAndSharePDF(opts: ExportOptions): Promise<void> {
  const db    = await getDB();
  const since = daysAgo(opts.days);
  const now   = Date.now();
  const dateRange = `${formatDate(since)} – ${formatDate(now)}`;

  // Fetch data
  const moodRows = await db.getAllAsync<{
    created_at: number; mood: number; energy: number; sleep: number; slot: string;
  }>(
    `SELECT created_at, mood, energy, sleep, slot FROM mood_entries WHERE created_at >= ? ORDER BY created_at ASC`,
    [since]
  );

  const triggerRows = await db.getAllAsync<{
    created_at: number; event: string; reaction: string; intensity: number; note: string | null;
  }>(
    `SELECT created_at, event, reaction, intensity, note FROM trigger_logs WHERE created_at >= ? ORDER BY created_at DESC`,
    [since]
  );

  const groundingRows = await db.getAllAsync<{
    created_at: number; type: string; duration_s: number;
  }>(
    `SELECT created_at, type, duration_s FROM grounding_sessions WHERE created_at >= ? ORDER BY created_at DESC`,
    [since]
  );

  // Compute mood stats
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

  const roleLabel = opts.role === 'veteran' ? 'Veteran' : 'First Responder';

  // Build HTML
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
        <thead><tr><th>Mood Level</th><th>Days</th></tr></thead>
        <tbody>
          ${['Rough','Low','Okay','Good','Solid'].map((label, i) => `
            <tr><td>${label}</td><td>${moodCounts[i]}</td></tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

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
              <td>${r.intensity}/10</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${triggerRows.length > 20 ? `<p class="note">Showing 20 most recent of ${triggerRows.length} entries.</p>` : ''}
    </div>
  ` : '';

  const groundingSection = opts.includeGrounding && groundingRows.length > 0 ? `
    <div class="section">
      <div class="section-title">Calm Toolkit Usage</div>
      <div class="stat-grid">
        <div class="stat-box">
          <div class="stat-label">Sessions</div>
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
    </div>
  ` : '';

  const notesSection = opts.includeNotes && opts.userNotes.trim() ? `
    <div class="section">
      <div class="section-title">Personal Notes</div>
      <p class="notes-text">${opts.userNotes.trim().replace(/\n/g, '<br/>')}</p>
    </div>
  ` : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1A18; background: #fff; padding: 40px; font-size: 13px; }
  .header { border-bottom: 3px solid #1A1A18; padding-bottom: 16px; margin-bottom: 24px; }
  .app-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .report-title { font-size: 14px; color: #5F5E5A; margin-top: 2px; }
  .meta { display: flex; gap: 32px; margin-top: 12px; }
  .meta-item { font-size: 11px; color: #5F5E5A; }
  .meta-item strong { color: #1A1A18; font-weight: 600; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #5F5E5A; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E0DFD8; }
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .stat-box { background: #F5F4F0; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #888780; margin-bottom: 4px; }
  .stat-value { font-size: 18px; font-weight: 700; color: #1A1A18; }
  .stat-sub { font-size: 10px; color: #888780; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #F5F4F0; padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #5F5E5A; }
  td { padding: 8px 10px; border-bottom: 1px solid #F5F4F0; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .note { font-size: 10px; color: #888780; margin-top: 8px; font-style: italic; }
  .notes-text { font-size: 13px; color: #1A1A18; line-height: 1.75; background: #F5F4F0; border-radius: 8px; padding: 14px; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #E0DFD8; font-size: 10px; color: #B4B2A9; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">RallyZone</div>
    <div class="report-title">Personal Health Summary Report</div>
    <div class="meta">
      <div class="meta-item"><strong>Call Sign:</strong> ${opts.callSign || 'Not set'}</div>
      <div class="meta-item"><strong>Background:</strong> ${roleLabel}</div>
      <div class="meta-item"><strong>Period:</strong> ${dateRange}</div>
      <div class="meta-item"><strong>Generated:</strong> ${formatDate(now)}</div>
    </div>
  </div>

  ${moodSection}
  ${triggerSection}
  ${groundingSection}
  ${notesSection}

  <div class="footer">
    This report contains personal health data exported from RallyZone by LyfieldCreationsOS.
    It is not a VA form and does not constitute a medical or legal record.
    It is intended for use as supporting documentation at the discretion of the user.
    All data was generated and stored locally on the user's device. No data was transmitted to any server.
  </div>
</body>
</html>
  `;

  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Export RallyZone Report',
      UTI: 'com.adobe.pdf',
    });
  }
}