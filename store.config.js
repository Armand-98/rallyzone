/** @type {import('eas-cli/build/metadata/schema').StoreConfig} */
const config = {
  configVersion: 0,
  apple: {
    copyright: '2026 Lyfield',
    primaryCategory: 'HEALTH_AND_FITNESS',
    info: {
      'en-US': {
        title: 'RallyZone',
        subtitle: 'Built for U.S. Veterans',
        description: `RallyZone is a private mental performance and emotional regulation app built exclusively for U.S. veterans.

Track your mood, log what's triggering you, and build self-awareness — all without an account, without internet access, and without sharing any data.

YOUR DATA STAYS ON YOUR DEVICE
Everything is stored locally on your phone. No cloud sync. No tracking. No data sold. Ever.

WHAT YOU CAN DO
• Morning & Evening Brief — Log your mood, energy, and sleep on 5-point scales each day
• 30-Day Heatmap — See your emotional patterns at a glance with a color-coded calendar
• Trigger Log — Record events, reactions, and intensity ratings to understand what activates your stress response
• Calm Tools — In-the-moment grounding and de-escalation exercises
• Pattern Insights (Premium) — Aggregate analytics to identify trends in your mood and triggers over time
• Secure Vault (Premium) — Biometric-protected private notes, encrypted directly on your device
• PDF Export (Premium) — Generate 30, 60, or 90-day reports you can bring to VA appointments or private sessions

BUILT FOR VETERANS
RallyZone uses language and framing designed for military culture — no generic wellness buzzwords, no forced positivity. Just a clean, private tool for self-regulation and pattern awareness.

PRIVACY FIRST
• No account required
• Works fully offline
• No ads or data brokers
• Secure Vault protected by Face ID or Touch ID
• Not affiliated with or endorsed by the Department of Veterans Affairs

IMPORTANT: RallyZone is not a medical app and is not a substitute for professional mental health care. If you are in crisis, contact the Veterans Crisis Line by dialing 988 and pressing 1, or text 838255.`,
        keywords: [
          'veterans',
          'PTSD',
          'mood tracker',
          'mental health',
          'trigger log',
          'military',
          'stress',
          'grounding',
          'VA',
          'emotional',
        ],
        releaseNotes:
          'Initial release. A private mental performance and emotional regulation app built exclusively for U.S. veterans.',
      },
    },
  },
};

module.exports = config;
