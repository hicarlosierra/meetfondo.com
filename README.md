# Fondo · Web v4 (home, página de viaje y sobre nosotros)

Hecha a partir de Figma, «Landing Dec 26»: «Home · Desktop optimizado», «Costa Brava · Desktop optimizado», «Sobre nosotros · Desktop optimizado» y «Formulario» (lista de espera). Contenido a 1344 px como máximo, márgenes de 48 px y la escala tipográfica de esos frames (bloque «v5» al final de `styles.css`). Antes de pasarlo a código se ajustó el Figma a la rejilla de 12 columnas (copia de seguridad en la página «Backup · 23 nov (antes del ajuste)»).
Sirve para probar el responsive, las animaciones y la UX antes de pasarla a producción.

## Cómo abrirla

- Lo mejor es con un servidor local, porque así se comporta igual que en producción:
  `python3 -m http.server 8000` dentro de esta carpeta y entra en http://localhost:8000
- También funciona con doble clic en `index.html`. Pero así el navegador no deja leer las fotos, y la cabecera decide blanco o negro según el color de cada sección, no según la foto.
- Para probarla en el móvil, súbela tal cual a cualquier hosting estático (GitHub Pages, Vercel, Netlify).

## Estructura

```
index.html                    Home
viajes/costa-brava/index.html Campamento Open Water (Costa Brava)
sobre-nosotros/index.html     Sobre nosotros
css/styles.css                Estilos de las tres páginas (mobile first; desktop desde 900 px)
js/loader.js                  Loader («fondo» → ánfora → telón), solo en la home
js/main.js                    Interacciones, sin dependencias
assets/img/                   Fotos en WebP
assets/video/                 Vídeo del hero (buzo), en varias versiones
assets/fonts/                 Inter 3.19 y DM Mono (autoalojadas)
```

Las tres páginas comparten cabecera, menú móvil, footer y formulario de lista de espera.

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
| Óvalo de la guía (home) | Óvalo blanco «Apúntame a la lista de espera»: aparece bajo el puntero al entrar en las fotos y lo sigue. Clic: abre el formulario | Fijo como sello en la foto |
| Óvalo del hero del viaje | Igual, en todo el hero. Al bajar, «viaja» hasta la esquina inferior derecha y se queda ahí como botón «Lista de espera», siempre visible | Fijo en el hero; al bajar, botón abajo a la derecha |
| Formulario «Lista de espera» | Cajón a la derecha (592 px). Se abre desde el óvalo, «Cuenta conmigo», el botón de la cabecera o `#lista` en la dirección. Se cierra con la X, Escape o clic fuera. Valida los obligatorios y da las gracias | Hoja a pantalla completa |
| Óvalo del footer | Aparece al entrar en el footer con «Llegaste al fondo»; encima de un enlace muestra su nombre. Con teclado se ve al enfocar | Fijo como sello arriba a la derecha |
| Manifiesto | Dos frases. La foto va siempre detrás del texto: aparece al entrar, sigue al puntero y cambia con la frase que pisas (de gris a negro) | La frase activa cambia con el scroll; foto fija detrás |
| Viajes | Sección fija. Cada paso de scroll, con snap suave (la «fricción»), sube la siguiente tarjeta y marca su tipo de viaje (Open Water o buceadores). Clic en un tipo lleva a su primer viaje | Tipos arriba y carrusel con snap |
| Cómo viajamos | Acordeón, una fila abierta cada vez; la abierta en celeste y con el título más grande | Igual |
| Dónde pasa (viaje) | Carrusel: se arrastra con el ratón o el trackpad y con las flechas; encaja tarjeta a tarjeta | Tarjeta y media a la vista, con snap |
| Preguntas (viaje) | Acordeón, una abierta cada vez. «Tengo otra pregunta» es un campo: al escribir y pulsar Enter abre WhatsApp con la pregunta | Igual |
| Sobre nosotros | El contador 01 → 02 → 03 se queda fijo mientras pasan los tres principios | Contador fijo bajo la cabecera |
| Cinta de óvalos | Movimiento continuo; se para al pasar el ratón | Movimiento continuo |

Con «reducir movimiento» activado en el sistema, todo queda estático.

Parámetros fáciles de ajustar:
- Recorrido de cada paso de Viajes: `--step: 60svh` en `styles.css`.
- Número de WhatsApp y dirección del formulario: `FONDO` al principio de `main.js`.
- Separación entre la foto del Manifiesto y el puntero: `OFFSET` en `main.js`.
- Velocidad de la cinta: `animation: marquee 45s` en `styles.css`.

## Loader

Es el loader que hiciste, integrado sin tocar el motor. Va en `js/loader.js`, con el marcado al principio del `<body>` y los estilos en `styles.css`. Fondo beige y logo azul con los tokens de la web (#FAF3EB y #1E57B1).

- **Secuencia (unos 3 s):** «fondo» en reposo 0,6 s → se transforma en el ánfora en 1,2 s → el ánfora se asienta 0,35 s → el panel sube como un telón en 1 s. Mientras sube, la foto del hero se asienta y «fondo» sube desde abajo.
- **Tiempo real con un mínimo.** No es un tiempo fijo: espera a que la página cargue de verdad, pero nunca sale antes de completar el gesto. Si la carga tarda, el logo sigue transformándose y sale siempre desde el ánfora. Como mucho espera 7 s (`MAX_WAIT`).
- **Una vez por sesión.** `ONCE` en el `<head>` de `index.html`. Ahora está en `false` para que lo veas en cada recarga. En producción conviene ponerlo en `true`, así solo sale la primera vez que alguien entra.
- **Seguridad.** Con «reducir movimiento» pasa a un fundido simple. Si el JS no llega a cargar, el loader se aparta solo a los 9 s.
- **Ajustes.** Tiempos, efecto líquido y salida, en el bloque 1 de `js/loader.js`.

## Escala tipográfica

Nueve roles para toda la web (variables `--t-*` en `styles.css`), en desktop / móvil: Display 72/40, Titular 44/26, Título 32/24, Entradilla 24/20, Cuerpo L 18/17, Cuerpo 16, Pequeño 14, Etiqueta 12 (Semibold, mayúsculas, +6 %) y Mono 12 (DM Mono, solo números y fechas). Solo Inter (Instrument Sans ya no se usa) y tres pesos principales: Light para entradillas, Regular para texto y Medium para títulos, con Semibold/Bold para énfasis. Fuera de escala, a propósito: «Costa Brava» en el hero del viaje, «Queremos salvar el mundo» y «Parar, respirar y disfrutar» en Sobre nosotros, el contador, «Good things take depth.» del footer, el manifiesto y el wordmark.

## Vídeo del hero (home)

Solo el vídeo del buzo. Los otros cinco de las pruebas (cueva, pared, mar, santorini y playa) y su selector se quitaron el 23 nov 2026; siguen en el historial de git.

**Versiones.** H.264 sin audio, en bucle. El script elige la versión antes de cargar nada:

| Versión | Para | Notas |
|---|---|---|
| `-1920.mp4` | Full HD y portátiles retina | |
| `-1280.mp4` | Portátiles pequeños o conexión lenta | |
| `-movil.mp4` | Móvil y tablet en vertical | Recorte 9:16 a 1080×1920 |
| `-movil-sd.mp4` | Móvil con conexión lenta | 720×1280 |

Elige la más pequeña que cubra la pantalla (ancho real en píxeles, con densidad hasta 2×). Un móvil en horizontal no pasa de 1920. Con «reducir movimiento» o ahorro de datos no se descarga ningún vídeo: se queda el póster.

Calidad máxima: sin limpieza de grano, CRF 18-19. El original del buzo es 1280×720; las versiones 1920 y móvil están reescaladas (es el límite de ese archivo).

**Cabecera sobre el vídeo.** El vídeo lleva en `main.js` (`VIDEO_LUM`) un mapa 24×24 con la luminosidad mediana de todo el bucle, de la versión horizontal y de la de móvil. La cabecera usa ese mapa para ponerse blanca o negra: elige lo que mejor se lee durante la mayor parte del vídeo y no parpadea con cada plano. Si se cambia un vídeo, hay que regenerar su mapa (ffmpeg a 4 fps, celdas de 24×24, mediana en el tiempo, raíz cuadrada en base64).

**Exportar un vídeo nuevo** (ejemplo 1920): `ffmpeg -i original.mp4 -an -c:v libx264 -preset slow -tune film -x264-params aq-mode=3:deblock=-1,-1 -crf 18 -maxrate 12000k -bufsize 24000k -pix_fmt yuv420p -movflags +faststart -vf "scale=1920:1080:flags=lanczos" hero-NOMBRE-1920.mp4`

## Publicación (GitHub Pages)

- Se publica desde la rama `main`, carpeta raíz. Cada push actualiza la web en uno o dos minutos.
- `.nojekyll` evita que GitHub procese la web con Jekyll: sirve los archivos tal cual.
- Versión en pruebas: lleva `<meta name="robots" content="noindex, nofollow">` para que no salga en Google. Quitarlo al lanzar.
- La imagen para compartir (WhatsApp, LinkedIn, X) es `assets/img/og-fondo.jpg` (y `og-costa-brava.jpg` en la página del viaje), 1200×630. `og:image` y `og:url` llevan la URL completa (https://meetfondo.com/). Si cambia el dominio, hay que cambiarlas también. El archivo `CNAME` es el del dominio propio: no borrarlo.

## Pendiente

Los enlaces pendientes muestran un aviso «Pendiente» al pulsarlos.

- Conectar el formulario de la lista de espera (`formEndpoint` en `main.js`) y los dos de newsletter.
- Número de WhatsApp (`whatsapp` en `main.js`). Sin número, WhatsApp abre con el texto escrito y deja elegir el contacto.
- Instagram y textos legales.
- Fotos y fechas de los viajes para buceadores (Mar Rojo y Baja California Sur): ahora llevan fotos de relleno.
- Revisar contenido: «10 plazas» (guía de la home) frente a «12 personas» (viaje); «seis inmersiones» en el texto del Open Water frente a las 4 inmersiones del gráfico; el título de «Dónde pasa» repite el de «¿Te vienes?».
- Versión en inglés.
