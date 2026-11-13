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

- **Modo pruebas:** hay cuatro vídeos y en cada carga sale uno al azar, sin repetir el anterior. Para ver uno concreto: `?video=buzo`, `?video=cueva`, `?video=pared` o `?video=mar` al final de la dirección. Cuando elijáis uno, se deja solo ese en la lista `VIDEOS` del `<script>` junto al `<video>` y se borran los demás de `assets/video/`.
- Cada vídeo tiene tres versiones, H.264 sin audio: `-1920.mp4` (pantallas grandes o retina), `-1280.mp4` (portátiles o conexión lenta) y `-movil.mp4` (recorte vertical 960×1080 para móviles en vertical), más sus pósters (primer fotograma).
  - buzo: original 1280×720, la de 1920 reescalada. 6,8 / 4,6 / 3,6 MB.
  - cueva: original 4K. 7,2 / 2,4 / 4,3 MB.
  - pared: original 1920×1080 a 60 fps, pasado a 30 fps. 5,8 / 2,9 / 3,6 MB.
  - mar: original 4K de 28 s, recortado a un bucle de 8 s sin corte (fundido de 1,5 s del final al principio). El agua apenas se deja comprimir, así que va con bitrate limitado (6 / 4 / 3,5 Mbps): 6,1 / 4,0 / 3,5 MB.
- Con «reducir movimiento» o ahorro de datos no se descarga: se queda el póster. Se pausa cuando sale de pantalla.
- La cabecera mide el fotograma que se ve en cada momento para ponerse blanca o negra. Si cambia por el propio vídeo (sin scroll), espera 1,2 s antes de cambiar, para que no parpadee.
- Exportar un vídeo nuevo: `ffmpeg -i original.mp4 -an -c:v libx264 -preset slow -tune film -x264-params aq-mode=3 -crf 20 -pix_fmt yuv420p -movflags +faststart -vf scale=1920:1080:flags=lanczos hero-NOMBRE-1920.mp4` (y lo mismo a 1280×720 y con `crop` vertical 8:9 escalado a 960×1080 para el móvil).

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
