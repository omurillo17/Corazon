const escenas = document.querySelectorAll('.escena');
const btnSi = document.getElementById('btn-si');
// Cada "No" recuerda su escena, porque al huir se muda al body
const noes = [...document.querySelectorAll('.btn-no')].map(btn => ({ btn, escena: btn.closest('.escena') }));

let actual = 0;

const mostrar = (i) => {
    escenas[actual].classList.remove('activa');
    escenas[actual].querySelectorAll('video').forEach(v => v.pause());
    actual = i;
    escenas[actual].classList.add('activa');
    escenas[actual].querySelectorAll('video').forEach(v => v.play().catch(() => {}));
    noes.forEach(n => { n.btn.hidden = n.escena !== escenas[actual]; });
};

document.querySelectorAll('.siguiente').forEach(btn =>
    btn.addEventListener('click', () => mostrar(actual + 1))
);

const moverBoton = (btnNo, px, py) => {
    // Sacamos el botón del flujo normal para que nade por todo el body
    if (btnNo.parentNode !== document.body) {
        const { left, top } = btnNo.getBoundingClientRect();
        // Hueco invisible: así el "Sí" no se recorre bajo el cursor
        const hueco = btnNo.cloneNode(true);
        hueco.removeAttribute('id');
        hueco.style.visibility = 'hidden';
        btnNo.replaceWith(hueco);
        document.body.appendChild(btnNo);
        btnNo.style.position = 'fixed';
        btnNo.style.left = `${left}px`;
        btnNo.style.top = `${top}px`;
        btnNo.offsetWidth; // fuerza reflow para que la transición arranque desde aquí
    }

    const margen = 20;
    const maxX = document.documentElement.clientWidth - btnNo.offsetWidth - margen;
    const maxY = document.documentElement.clientHeight - btnNo.offsetHeight - margen;

    // Buscamos un lugar lejos del cursor/dedo
    let x, y, intentos = 0;
    do {
        x = Math.max(margen, Math.random() * maxX);
        y = Math.max(margen, Math.random() * maxY);
    } while (Math.hypot(x - px, y - py) < 200 && ++intentos < 30);

    btnNo.style.left = `${x}px`;
    btnNo.style.top = `${y}px`;
};

// Huye en cuanto el cursor se acerca (antes de poder tocarlo)
document.addEventListener('pointermove', (e) => {
    const no = noes.find(n => n.escena === escenas[actual]);
    if (!no) return;
    const r = no.btn.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
    const dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    if (Math.hypot(dx, dy) < 60) moverBoton(no.btn, e.clientX, e.clientY);
});

noes.forEach(({ btn }) => {
    btn.addEventListener('click', (e) => moverBoton(btn, e.clientX, e.clientY));
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moverBoton(btn, e.touches[0].clientX, e.touches[0].clientY);
    });
});

// Lluvia de burbujas y peces desde el botón "Sí"
const estallido = (x, y) => {
    const emojis = ['🫧', '🐠', '💙', '🐟', '🪼', '🐚', '💕'];
    for (let i = 0; i < 30; i++) {
        const el = document.createElement('span');
        el.className = 'estallido';
        el.textContent = emojis[i % emojis.length];
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.setProperty('--x', `${(Math.random() - 0.5) * 600}px`);
        el.style.setProperty('--y', `${-Math.random() * 500 - 50}px`);
        el.style.animationDelay = `${Math.random() * 0.3}s`;
        document.body.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }
};

btnSi.addEventListener('click', (e) => {
    estallido(e.clientX, e.clientY);
    mostrar(actual + 1);
});

// Ramo en pastel: pinceladas que toman el color de la foto y siguen sus bordes
const lienzo = document.getElementById('lienzo');
const btnPastel = document.getElementById('btn-pastel');
let rosaElegida = '';

// Cierre: destello del marco, burbujas, cambio de texto y aparece el botón (su espacio ya estaba reservado)
const terminarPintura = () => {
    // Copia del ramo pintado para la escena final
    document.getElementById('recuerdo').getContext('2d').drawImage(lienzo, 0, 0);
    lienzo.closest('.marco').classList.add('terminado');
    const { left, top, width, height } = lienzo.getBoundingClientRect();
    estallido(left + width / 2, top + height / 2);
    const texto = document.getElementById('texto-pastel');
    texto.classList.add('cambio');
    setTimeout(() => { texto.textContent = 'Es para ti'; texto.classList.remove('cambio'); }, 400);
    btnPastel.classList.add('listo');
};

const pintar = (src) => {
    const ctx = lienzo.getContext('2d');
    const W = lienzo.width, H = lienzo.height;

    // Papel crema con grano
    ctx.fillStyle = '#f4ecdc';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 5000; i++) {
        ctx.fillStyle = `rgba(120, 100, 70, ${Math.random() * 0.12})`;
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }

    const img = new Image();
    img.onerror = () => terminarPintura(); // si falla la foto, que el flujo siga
    img.onload = () => {
        // Copia recortada (tipo object-fit: cover) para leer colores
        const copia = document.createElement('canvas');
        copia.width = W;
        copia.height = H;
        const c2 = copia.getContext('2d', { willReadFrequently: true });
        const s = Math.max(W / img.width, H / img.height);
        c2.drawImage(img, (W - img.width * s) / 2, (H - img.height * s) / 2, img.width * s, img.height * s);
        let px;
        try {
            px = c2.getImageData(0, 0, W, H).data;
        } catch {
            // Abierto como file:// el navegador no deja leer píxeles: mostramos la foto tal cual
            ctx.drawImage(copia, 0, 0);
            terminarPintura();
            return;
        }
        const lum = (x, y) => {
            const i = (y * W + x) * 4;
            return 0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2];
        };

        // Capas de gruesas a finas; las finas solo donde hay bordes (detalle)
        const capas = [16, 9, 5].map(r => {
            const trazos = [];
            for (let y = 0; y < H; y += r) {
                for (let x = 0; x < W; x += r) {
                    const cx = Math.min(W - 2, Math.max(1, x + Math.floor(Math.random() * r)));
                    const cy = Math.min(H - 2, Math.max(1, y + Math.floor(Math.random() * r)));
                    const gx = lum(cx + 1, cy) - lum(cx - 1, cy);
                    const gy = lum(cx, cy + 1) - lum(cx, cy - 1);
                    const g = Math.hypot(gx, gy);
                    if (r === 5 && g < 12) continue;
                    const i = (cy * W + cx) * 4;
                    // Un poco aclarado (pastel) y con variación; el texto del color se arma aquí, no al animar
                    const [cr, cg, cb] = [px[i], px[i + 1], px[i + 2]].map(v => Math.round(v * 0.9 + 25 + (Math.random() - 0.5) * 26));
                    trazos.push({
                        x: cx, y: cy, r,
                        // A lo largo del borde; en zonas planas, achurado diagonal
                        a: g > 4 ? Math.atan2(gy, gx) + Math.PI / 2 : Math.PI / 4 + Math.random() * 0.6,
                        c: `rgb(${cr}, ${cg}, ${cb})`,
                    });
                }
            }
            return trazos.sort(() => Math.random() - 0.5); // manchas sueltas que se van uniendo
        });
        const trazos = capas.flat();

        ctx.lineCap = 'round';
        const trazo = ({ x, y, r, a, c }) => {
            const largo = r * (1.6 + Math.random());
            const dx = Math.cos(a), dy = Math.sin(a);
            ctx.strokeStyle = c;
            // Varias líneas finas paralelas = textura de crayón
            for (let k = 0; k < 3; k++) {
                const o = (Math.random() - 0.5) * r;
                const ox = x - dy * o, oy = y + dx * o;
                ctx.globalAlpha = 0.55 + Math.random() * 0.4;
                ctx.lineWidth = r * (0.3 + Math.random() * 0.35);
                ctx.beginPath();
                ctx.moveTo(ox - dx * largo / 2, oy - dy * largo / 2);
                ctx.lineTo(ox + dx * largo / 2, oy + dy * largo / 2);
                ctx.stroke();
            }
        };

        // 7 s con ease-out: arranca rápido y los últimos detalles llegan despacio.
        // Máximo 8 ms de dibujo por frame: en celulares lentos tarda un poco más, pero no se traba.
        const duracion = 7000;
        const inicio = performance.now();
        let n = 0;
        const paso = (ahora) => {
            const t = Math.min(1, (ahora - inicio) / duracion);
            const meta = Math.floor(trazos.length * (1 - (1 - t) ** 3));
            const limite = performance.now() + 8;
            while (n < meta && performance.now() < limite) trazo(trazos[n++]);
            if (n < trazos.length) requestAnimationFrame(paso);
            else {
                ctx.globalAlpha = 1;
                terminarPintura();
            }
        };
        requestAnimationFrame(paso);
    };
    img.src = src;
};

document.querySelectorAll('.rosa').forEach(btn =>
    btn.addEventListener('click', () => {
        rosaElegida = btn.querySelector('span').textContent;
        mostrar(actual + 1);
        const src = btn.querySelector('img').getAttribute('src');
        pintar(FOTOS[src] ?? src);
    })
);

// Día y hora (solo fechas desde hoy)
const fecha = document.getElementById('fecha');
const hora = document.getElementById('hora');
const btnCita = document.getElementById('btn-cita');
fecha.min = new Date().toLocaleDateString('en-CA'); // AAAA-MM-DD en hora local

[fecha, hora].forEach(input =>
    input.addEventListener('input', () => { btnCita.disabled = !(fecha.value && hora.value); })
);

btnCita.addEventListener('click', () => {
    const cuando = new Date(`${fecha.value}T${hora.value}`).toLocaleString('es', {
        weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
    });
    document.getElementById('resumen').textContent = `📅 ${cuando} · 💐 ${rosaElegida}`;
});

// Chiste de la moto: el "No" también huye
document.getElementById('btn-moto').addEventListener('click', (e) => {
    estallido(e.clientX, e.clientY);
    mostrar(actual + 1);
    // Me avisa por WhatsApp (función de Netlify); si falla, la página sigue igual
    fetch('/api/cita', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ramo: rosaElegida, fecha: fecha.value, hora: hora.value }),
        keepalive: true,
    }).catch(() => {});
});
