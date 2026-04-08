const btnNo = document.getElementById('btn-no');
const btnSi = document.getElementById('btn-si');
const mensajeExito = document.getElementById('mensaje-exito');
const opcionesDiv = document.querySelector('.opciones');

const moverBoton = () => {
    // Sacamos el botón del flujo normal para que vuele por todo el body
    if (btnNo.parentNode !== document.body) {
        document.body.appendChild(btnNo);
    }

    const margen = 20;

    const anchoVentana = document.documentElement.clientWidth;
    const altoVentana = document.documentElement.clientHeight;

    const maxX = anchoVentana - btnNo.offsetWidth - margen;
    const maxY = altoVentana - btnNo.offsetHeight - margen;

    const randomX = Math.max(margen, Math.floor(Math.random() * maxX));
    const randomY = Math.max(margen, Math.floor(Math.random() * maxY));

    btnNo.style.position = 'fixed';
    btnNo.style.left = `${randomX}px`;
    btnNo.style.top = `${randomY}px`;
    btnNo.style.zIndex = '9999'; // Para que siempre esté por encima de todo
};

// Eventos de escape
btnNo.addEventListener('mouseover', moverBoton);
btnNo.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moverBoton();
});

// Evento cuando dice que Sí
btnSi.addEventListener('click', () => {
    opcionesDiv.style.display = 'none';
    btnNo.style.display = 'none';
    mensajeExito.classList.remove('oculto');
});