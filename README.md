# Fondo · Landing v3.2 (responsive + menú móvil + loader)

Versión responsive de la landing, hecha a partir de Figma, «Landing Dec 26» > Opción 02.
Sirve para probar el responsive, las animaciones y la UX antes de pasarla a producción.

## Cómo abrirla

- Lo mejor es con un servidor local, porque así se comporta igual que en producción:
  `python3 -m http.server 8000` dentro de esta carpeta y entra en http://localhost:8000
- También funciona con doble clic en `index.html`. Pero así el navegador no deja leer las fotos, y la cabecera decide blanco o negro según el color de cada sección, no según la foto.
- Para probarla en el móvil, súbela tal cual a cualquier hosting estático (GitHub Pages, Vercel, Netlify).

## Estructura

```
index.html          Marcado de las 12 secciones
css/styles.css      Estilos (mobile first; desktop desde 900 px)
js/loader.js        Loader («fondo» → ánfora → telón), sin dependencias
js/main.js          Interacciones, sin dependencias
assets/img/         Fotos en WebP
assets/fonts/       Inter 3.19, Instrument Sans y DM Mono (autoalojadas)
```

## Tipografía

Es la **Inter 3.19**, la misma que usa Figma, autoalojada en la carpeta de fuentes. La versión anterior del HTML cargaba la Inter 4 (la de Google Fonts), que tiene la «a», la «g» y las cursivas más redondas y no coincide con el diseño. En `styles.css` no se debe volver a la Inter 4 ni cargarla desde Google Fonts.

## Sistema responsive

- **Tamaños fluidos.** Cada tamaño de letra y cada espacio va del valor de Figma mobile (a 390 px de ancho) al de Figma desktop (a 1440 px), sin saltos entre medias. Así coincide con Figma en los dos anchos de referencia y se adapta a tablets y portátiles pequeños.
- **Por encima de 1440.** Entre 1440 y 1600 de ancho la composición crece en proporción. A partir de 1600 los tamaños se quedan fijos y solo crece el aire. El contenido llega como mucho a 1920 px y los fondos van siempre a sangre.
- **Mínimos.** Ningún texto baja de 12 px y el texto de lectura no baja de 14 a 16 px.
- **Alturas según la pantalla.** Las secciones que deben verse enteras se ajustan al alto visible:
  - Hero: 100 % de la pantalla.
  - Viajes: fija mientras se recorre.
  - Guía Costa Brava y Campamento: entre 520 y 852 px, y nunca más que la pantalla.
- **Hero.** El wordmark va de margen a margen y se hunde por abajo un 5 %, como en Figma. En pantallas bajas (portátiles, móvil en horizontal) se hunde hasta un 15 % para no ocupar más de la mitad del hero, y si aun así no cabe, se reduce.
- **Viajes.** En desktop (≥ 900 de ancho y ≥ 600 de alto) la sección queda fija y cada paso de scroll activa un destino y mueve la tira de postales. La postal se escala con el alto de la pantalla para verse siempre entera, con la anterior y la siguiente asomando. En móvil, tablet vertical y pantallas bajas se convierte en lista más carrusel.

Rangos probados: 360, 390 y 430 (móvil), 844 × 390 (móvil en horizontal), 768 y 1024 (tablet), 1280 × 720, 1366 × 657, 1440 × 780, 1536 × 864, 1920 × 1080 y 2560 × 1440.

## Interacciones

| Elemento | Con ratón | Táctil |
|---|---|---|
| Cabecera | Fija, sin fondo. Cada elemento se pone blanco o negro según lo que tenga detrás, píxel a píxel cuando pasa por encima del wordmark del hero | Igual |
| Menú móvil (< 900 px) | (no aplica) | Cabecera con logo, próximo viaje e icono de menú. El menú cae como una cortina; se cierra con la X, con Escape o al elegir un enlace, que baja a su sección. Bloquea el scroll de la página, mantiene el foco dentro y tiñe de azul la barra del navegador |
| Óvalos de las postales y la guía | No se ven; aparecen bajo el puntero al entrar en la foto, lo siguen y desaparecen al salir. Toda la postal es un enlace | Fijos como sello |
| Óvalo del footer | Aparece al entrar en el footer con «Llegaste al fondo»; encima de un enlace muestra su nombre | Fijo como sello |
| Manifiesto | Texto a todo el ancho. La foto aparece al entrar en la sección, sigue al puntero siempre y cambia con la frase que pisas (de gris a negro) | La frase activa cambia con el scroll; foto fija debajo |
| Viajes | Sección fija con snap suave; clic en un destino lleva a su postal | Carrusel con snap |
| Foto del faro | Secuencia de 3 fotos, 1,5 s cada una | Igual |
| Cómo viajamos | Acordeón, una fila abierta cada vez | Igual |
| Cinta de óvalos | Movimiento continuo; se para al pasar el ratón | Movimiento continuo |

Con «reducir movimiento» activado en el sistema, todo queda estático.

Parámetros fáciles de ajustar:
- Recorrido de cada paso de Viajes: `--step: 55svh` en `styles.css`.
- Separación entre la foto del Manifiesto y el puntero: `OFFSET` en `main.js`.
- Velocidad de la cinta: `animation: marquee 45s` en `styles.css`.

## Loader

Es el loader que hiciste, integrado sin tocar el motor. Va en `js/loader.js`, con el marcado al principio del `<body>` y los estilos en `styles.css`. Fondo beige y logo azul con los tokens de la web (#FAF3EB y #1E57B1).

- **Secuencia (unos 3 s):** «fondo» en reposo 0,6 s → se transforma en el ánfora en 1,2 s → el ánfora se asienta 0,35 s → el panel sube como un telón en 1 s. Mientras sube, la foto del hero se asienta y «fondo» sube desde abajo.
- **Tiempo real con un mínimo.** No es un tiempo fijo: espera a que la página cargue de verdad, pero nunca sale antes de completar el gesto. Si la carga tarda, el logo sigue transformándose y sale siempre desde el ánfora. Como mucho espera 7 s (`MAX_WAIT`).
- **Una vez por sesión.** `ONCE` en el `<head>` de `index.html`. Ahora está en `false` para que lo veas en cada recarga. En producción conviene ponerlo en `true`, así solo sale la primera vez que alguien entra.
- **Seguridad.** Con «reducir movimiento» pasa a un fundido simple. Si el JS no llega a cargar, el loader se aparta solo a los 9 s.
- **Ajustes.** Tiempos, efecto líquido y salida, en el bloque 1 de `js/loader.js`.

## Vídeo del hero (home)

**Modo pruebas.** Hay seis vídeos: buzo, cueva, pared, mar, santorini y playa. En cada carga sale uno al azar (sin repetir el anterior) y los puntos de la izquierda del hero cambian entre ellos. Al cambiar, la dirección pasa a `?video=NOMBRE`, así se puede pasar el enlace de uno concreto.

Cuando se elija uno: dejarlo solo en `LIST` (script junto al `<video>` en `index.html`), quitar el `<nav class="vpick">`, el bloque «1c» de `main.js` y el bloque «PRUEBAS · Selector» de `styles.src.css`, y borrar de `assets/video/` los demás vídeos.

**Versiones.** H.264 sin audio, en bucle. El script elige la versión antes de cargar nada:

| Versión | Para | Notas |
|---|---|---|
| `-2560.mp4` | Pantallas 1440p, 4K y retina grandes | Solo cueva y mar (originales en 4K) |
| `-1920.mp4` | Full HD y portátiles retina | |
| `-1280.mp4` | Portátiles pequeños o conexión lenta | |
| `-movil.mp4` | Móvil y tablet en vertical | Recorte 9:16 a 1080×1920 |
| `-movil-sd.mp4` | Móvil con conexión lenta | 720×1280 |

Elige la más pequeña que cubra la pantalla (ancho real en píxeles, con densidad hasta 2×). Un móvil en horizontal no pasa de 1920. Con «reducir movimiento» o ahorro de datos no se descarga ningún vídeo: se queda el póster.

Calidad máxima: sin limpieza de grano, CRF 18-19 y topes altos de bitrate. Cueva y mar (originales 4K) van en móvil a su resolución real, 1216×2160. Pesos aproximados: 1920 entre 9 y 19 MB; 2560 unos 20-23 MB; móvil entre 12 y 17 MB; móvil SD (solo conexión lenta) unos 3 MB. Empiezan a reproducirse en cuanto llegan los primeros segundos (faststart).

- buzo: original 1280×720 (las versiones 1920 y móvil están reescaladas; es el límite de ese archivo).
- cueva: original 4K.
- pared: original 1920×1080 a 60 fps, pasado a 30.
- mar: original 4K de 28 s → bucle de 8 s sin corte (fundido de 1,5 s del final al principio).
- santorini: original 1920×1080 de 21 s → bucle de 12 s desde el segundo 8 (ya con la roca en plano), con fundido.
- playa: original 1920×1080 de 17 s → bucle de 12 s con fundido.

**Cabecera sobre el vídeo.** Cada vídeo lleva en `main.js` (`VIDEO_LUM`) un mapa 24×24 con la luminosidad mediana de todo el bucle, de la versión horizontal y de la de móvil. La cabecera usa ese mapa para ponerse blanca o negra: elige lo que mejor se lee durante la mayor parte del vídeo y no parpadea con cada plano. Si se cambia un vídeo, hay que regenerar su mapa (ffmpeg a 4 fps, celdas de 24×24, mediana en el tiempo, raíz cuadrada en base64).

**Exportar un vídeo nuevo** (ejemplo 1920): `ffmpeg -i original.mp4 -an -c:v libx264 -preset slow -tune film -x264-params aq-mode=3:deblock=-1,-1 -crf 18 -maxrate 12000k -bufsize 24000k -pix_fmt yuv420p -movflags +faststart -vf "scale=1920:1080:flags=lanczos" hero-NOMBRE-1920.mp4`

## Página de viaje · `viajes/costa-brava/`

Mismo CSS y JS que la home. Secciones: hero, resumen, día a día (el acordeón de «Cómo viajamos»), perfil de profundidad (SVG), nota del equipo, dónde pasa (carrusel), por qué la Costa Brava, resumen del viaje, preguntas y cierre. En la cabecera, el enlace del próximo viaje pasa a ser «Solicita tu plaza».

Inventado como placeholder, pendiente de validar: plan por horas de cada día, profundidades del perfil, agua a 20 °C y visibilidad de 15 m, calendario de pagos y política de cancelación.

## Publicación (GitHub Pages)

- Se publica desde la rama `main`, carpeta raíz. Cada push actualiza la web en uno o dos minutos.
- `.nojekyll` evita que GitHub procese la web con Jekyll: sirve los archivos tal cual.
- Versión en pruebas: lleva `<meta name="robots" content="noindex, nofollow">` para que no salga en Google. Quitarlo al lanzar.
- La imagen para compartir (WhatsApp, LinkedIn, X) es `assets/img/og-fondo.jpg`, 1200×630. `og:image` y `og:url` llevan la URL completa (https://meetfondo.com/). Si cambia el dominio, hay que cambiarlas también. El archivo `CNAME` es el del dominio propio: no borrarlo.

## Pendiente

Los enlaces pendientes muestran un aviso «Pendiente» al pulsarlos.

- Formulario de reserva («Cuenta conmigo»).
- Enlaces de WhatsApp e Instagram.
- Conectar los dos formularios de newsletter.
- Textos legales.
- Vídeo del faro.
- Fotos definitivas de Mar Rojo, Mallorca, Tenerife y Maldivas.
- Versión en inglés.
- Unificar «Nosotros» (menú móvil) y «Sobre fondo» (cabecera desktop y footer).
- Formulario de solicitud del campamento y fotos reales de Tossa.
