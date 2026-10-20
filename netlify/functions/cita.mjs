// Sends the chosen bouquet, date and time to my Telegram through my bot, with no action needed from her.
// TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID live only in .env locally and in Netlify's environment variables,
// so they never land in the public repo or in the page source.
const RAMOS = ['Gerberas', 'Rosas', 'Girasoles'];

export default async (req) => {
    if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

    const { ramo, fecha, hora } = await req.json().catch(() => ({}));
    // Public endpoint: accept only the known values, never free text
    if (!RAMOS.includes(ramo) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        return new Response('Datos inválidos', { status: 400 });
    }

    const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return new Response('Falta configuración', { status: 500 });

    const dia = new Date(`${fecha}T12:00`).toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });
    const texto = `¡Dijo que sí! 💙\nRamo: ${ramo}\nDía: ${dia}\nHora: ${hora}`;

    const r = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: texto }),
    });
    return new Response(null, { status: r.ok ? 204 : 502 });
};

// Netlify's built-in rate limit, enforced at the edge: requests over the limit get 429 before reaching this code.
// ponytail: per-IP only (free plan); a global daily cap would need a counter in Netlify Blobs.
export const config = {
    path: '/api/cita',
    rateLimit: {
        windowLimit: 2,
        windowSize: 180,
        aggregateBy: ['ip', 'domain'],
    },
};
