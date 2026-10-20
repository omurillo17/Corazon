// Sends the chosen bouquet, date and time to my WhatsApp through CallMeBot.
// WHATSAPP_PHONE and CALLMEBOT_APIKEY live in .env locally and in Netlify's environment variables in production.
const RAMOS = ['Gerberas', 'Rosas', 'Girasoles'];

export default async (req) => {
    if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

    const { ramo, fecha, hora } = await req.json().catch(() => ({}));
    // The endpoint is public: accept only the known values, never free text
    if (!RAMOS.includes(ramo) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !/^\d{2}:\d{2}$/.test(hora)) {
        return new Response('Datos inválidos', { status: 400 });
    }

    const { WHATSAPP_PHONE, CALLMEBOT_APIKEY } = process.env;
    if (!WHATSAPP_PHONE || !CALLMEBOT_APIKEY) return new Response('Falta configuración', { status: 500 });

    const texto = `¡Dijo que sí! 💙\nRamo: ${ramo}\nDía: ${fecha}\nHora: ${hora}`;
    const url = 'https://api.callmebot.com/whatsapp.php?' + new URLSearchParams({
        phone: WHATSAPP_PHONE,
        text: texto,
        apikey: CALLMEBOT_APIKEY,
    });

    const r = await fetch(url);
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
