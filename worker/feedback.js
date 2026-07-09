/**
 * Cloudflare Worker — Food Empire Tycoon feedback ingest.
 *
 * Receives JSON POST from the in-game feedback modal, validates the payload,
 * and forwards it to a Discord webhook. Discord is the durable record AND
 * the admin UI — no database, no auth UI to build.
 *
 * Required secret (set via `wrangler secret put DISCORD_WEBHOOK_URL`):
 *   DISCORD_WEBHOOK_URL — full Discord webhook URL.
 *
 * Optional env vars (configurable in wrangler.toml [vars]):
 *   ALLOWED_ORIGIN — origin to allow via CORS. Defaults to '*'. Tighten to
 *                    'https://foodempiretycoon.com' once stable.
 */

const MAX_MESSAGE = 2000;
const MAX_NAME = 120;

const TYPE_LABEL = {
    bug:     '🐛 Bug',
    feature: '✨ Feature idea',
    other:   '💬 Other',
};

const TYPE_COLOR = {
    bug:     0xff6b6b, // coral
    feature: 0x58a6ff, // blue
    other:   0xc678dd, // magenta
};

export default {
    async fetch(request, env) {
        const allowOrigin = env.ALLOWED_ORIGIN || '*';
        const corsHeaders = {
            'Access-Control-Allow-Origin': allowOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);
        }

        if (!env.DISCORD_WEBHOOK_URL) {
            return jsonResponse({ error: 'Webhook not configured' }, 503, corsHeaders);
        }

        let payload;
        try {
            payload = await request.json();
        } catch {
            return jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders);
        }

        const validation = validate(payload);
        if (!validation.ok) {
            return jsonResponse({ error: validation.error }, 400, corsHeaders);
        }

        const embed = buildEmbed(payload, request);
        const discordRes = await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [embed] }),
        });

        if (!discordRes.ok) {
            return jsonResponse(
                { error: 'Forward failed', status: discordRes.status },
                502,
                corsHeaders,
            );
        }

        return jsonResponse({ ok: true }, 200, corsHeaders);
    },
};

function validate(p) {
    if (!p || typeof p !== 'object') return { ok: false, error: 'Bad payload' };
    if (typeof p.message !== 'string' || p.message.trim().length === 0) {
        return { ok: false, error: 'Message required' };
    }
    if (p.message.length > MAX_MESSAGE) {
        return { ok: false, error: 'Message too long' };
    }
    if (p.name && typeof p.name === 'string' && p.name.length > MAX_NAME) {
        return { ok: false, error: 'Name too long' };
    }
    if (p.type && !['bug', 'feature', 'other'].includes(p.type)) {
        return { ok: false, error: 'Invalid type' };
    }
    return { ok: true };
}

function buildEmbed(p, request) {
    const type = p.type || 'other';
    const label = TYPE_LABEL[type] || TYPE_LABEL.other;
    const color = TYPE_COLOR[type] || TYPE_COLOR.other;
    const ctx = p.context || {};
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const country = request.headers.get('CF-IPCountry') || '??';

    const fields = [];

    if (ctx.day || ctx.businessType || typeof ctx.money === 'number' || ctx.difficulty) {
        const parts = [];
        if (ctx.day !== null && ctx.day !== undefined) parts.push(`Day ${ctx.day}`);
        if (ctx.businessType) parts.push(ctx.businessType);
        if (typeof ctx.money === 'number') parts.push(`$${ctx.money.toLocaleString()}`);
        if (ctx.difficulty) parts.push(ctx.difficulty);
        if (typeof ctx.reputation === 'number') parts.push(`rep ${ctx.reputation}`);
        if (typeof ctx.employees === 'number') parts.push(`${ctx.employees} emp`);
        fields.push({ name: 'Game state', value: parts.join(' · '), inline: false });
    }

    if (ctx.gameVersion) {
        fields.push({ name: 'Version', value: String(ctx.gameVersion), inline: true });
    }
    if (ctx.viewport) {
        fields.push({ name: 'Viewport', value: String(ctx.viewport), inline: true });
    }
    if (country && country !== '??') {
        fields.push({ name: 'Country', value: country, inline: true });
    }
    if (ctx.userAgent) {
        // Truncate UA — full strings can be 200+ chars.
        const ua = String(ctx.userAgent).slice(0, 200);
        fields.push({ name: 'User agent', value: ua, inline: false });
    }
    if (ctx.url) {
        fields.push({ name: 'Path', value: String(ctx.url), inline: true });
    }

    return {
        title: `${label} — Food Empire Tycoon`,
        description: p.message.slice(0, 4000),
        color,
        author: p.name
            ? { name: `From: ${String(p.name).slice(0, MAX_NAME)}` }
            : { name: 'Anonymous' },
        fields,
        footer: { text: `IP ${ip}` },
        timestamp: ctx.timestamp || new Date().toISOString(),
    };
}

function jsonResponse(body, status, extraHeaders = {}) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...extraHeaders,
        },
    });
}
