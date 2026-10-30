/**
 * Genera las ilustraciones SVG del catálogo.
 *
 *   node scripts/generar-imagenes-productos.mjs
 *
 * Salida: api/src/main/resources/static/media/productos/<sku>.svg
 * Las imágenes son ilustraciones genéricas del tipo de producto (no réplicas
 * exactas ni material de fabricantes) para dar una idea visual al cliente.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const salida = join(raiz, 'api', 'src', 'main', 'resources', 'static', 'media', 'productos')

const C = {
  ink: '#0f3d4d',
  ink2: '#14566b',
  teal: '#0d9488',
  tealL: '#5eead4',
  tealD: '#0b6f68',
  slate: '#8ba3b5',
  line: '#b9cede',
  white: '#ffffff',
  warn: '#f59e0b',
  blue: '#2f6f9f',
  dark: '#12303c',
}

const S = (contenido, etiqueta) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360" role="img" aria-label="${etiqueta}">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8fcfd"/>
      <stop offset="1" stop-color="#e3eef6"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#e8f1f6"/>
    </linearGradient>
    <linearGradient id="pantalla" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f3d4d"/>
      <stop offset="1" stop-color="#16586b"/>
    </linearGradient>
    <pattern id="trama" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.6" fill="${C.teal}" opacity="0.09"/>
    </pattern>
  </defs>
  <rect width="480" height="360" fill="url(#fondo)"/>
  <rect width="480" height="360" fill="url(#trama)"/>
  <ellipse cx="240" cy="308" rx="152" ry="13" fill="${C.ink}" opacity="0.07"/>
${contenido}
</svg>
`

/* ---------------------------------------------------------------- equipo */

const miscq = S(
  `<g>
    <rect x="104" y="116" width="272" height="156" rx="16" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <path d="M104 168h272" stroke="#dbe8ef" stroke-width="2"/>
    <rect x="126" y="134" width="66" height="12" rx="6" fill="#d7e6ef"/>
    <circle cx="346" cy="140" r="6" fill="${C.teal}"/>
    <rect x="126" y="184" width="118" height="72" rx="7" fill="#eef6f9" stroke="#cfe0ea"/>
    <rect x="134" y="192" width="102" height="56" rx="3" fill="url(#pantalla)"/>
    <path d="M144 236l16-20 13 11 15-19 19 28" fill="none" stroke="${C.tealL}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="262" y="186" width="96" height="26" rx="7" fill="#eaf3f7" stroke="#cfe0ea"/>
    <circle cx="276" cy="199" r="4.5" fill="${C.teal}"/>
    <rect x="288" y="195" width="58" height="8" rx="4" fill="#c3d7e3"/>
    <rect x="262" y="224" width="96" height="32" rx="9" fill="${C.dark}"/>
    <rect x="272" y="235" width="76" height="10" rx="5" fill="${C.tealL}" opacity="0.85"/>
    <circle cx="214" cy="278" r="3.5" fill="#bed2df"/>
  </g>`,
  'Secuenciador de sobremesa',
)

const minion = S(
  `<g>
    <rect x="176" y="96" width="128" height="188" rx="18" fill="${C.dark}"/>
    <rect x="176" y="96" width="128" height="188" rx="18" fill="url(#pantalla)" opacity="0.55"/>
    <rect x="192" y="114" width="96" height="66" rx="8" fill="#081f27"/>
    <path d="M204 164c10-26 18-26 26 0s16 26 24 0 14-26 22 0" fill="none" stroke="${C.tealL}" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="192" y="196" width="96" height="9" rx="4.5" fill="#1c4d5e"/>
    <rect x="192" y="212" width="60" height="8" rx="4" fill="#1c4d5e"/>
    <circle cx="240" cy="252" r="15" fill="${C.teal}"/>
    <circle cx="240" cy="252" r="6" fill="${C.tealL}"/>
    <path d="M304 200c26 0 40 12 40 30v34" fill="none" stroke="${C.ink2}" stroke-width="5" stroke-linecap="round"/>
    <rect x="330" y="264" width="28" height="12" rx="6" fill="${C.ink2}"/>
    <rect x="92" y="212" width="52" height="34" rx="6" fill="${C.teal}" opacity="0.18"/>
    <rect x="98" y="218" width="40" height="22" rx="3" fill="none" stroke="${C.teal}" stroke-width="2"/>
    <circle cx="112" cy="229" r="2.4" fill="${C.teal}"/>
    <circle cx="124" cy="229" r="2.4" fill="${C.teal}"/>
  </g>`,
  'Secuenciador portátil',
)

const termociclador = S(
  `<g>
    <rect x="118" y="160" width="244" height="112" rx="14" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="142" y="122" width="196" height="44" rx="11" fill="${C.dark}"/>
    <rect x="156" y="134" width="168" height="9" rx="4.5" fill="${C.tealL}" opacity="0.6"/>
    <rect x="136" y="176" width="92" height="54" rx="7" fill="#0b2b33"/>
    <text x="182" y="200" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" fill="${C.tealL}">95.0 °C</text>
    <rect x="150" y="210" width="64" height="7" rx="3.5" fill="#1c4d5e"/>
    <g fill="#dbe8ef" stroke="#c2d6e3" stroke-width="1.2">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = 246 + (i % 8) * 13
        const y = 182 + Math.floor(i / 8) * 13
        return `<circle cx="${x}" cy="${y}" r="4"/>`
      }).join('\n      ')}
    </g>
    <rect x="240" y="228" width="104" height="24" rx="12" fill="#eaf3f7" stroke="#cfe0ea"/>
    <text x="292" y="244" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="${C.ink2}">96 pocillos</text>
  </g>`,
  'Termociclador de laboratorio',
)

/* --------------------------------------------------------------- reactivo */

const cajaKit = S(
  `<g>
    <path d="M126 150l112-26 112 26-112 26z" fill="#f2f8fb" stroke="${C.line}" stroke-width="2"/>
    <path d="M126 150v96l112 26 112-26v-96" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <path d="M238 176v96" stroke="#dbe8ef" stroke-width="2"/>
    <rect x="146" y="178" width="74" height="46" rx="6" fill="${C.teal}" opacity="0.14"/>
    <text x="183" y="200" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="${C.tealD}">LIBRARY</text>
    <text x="183" y="213" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="${C.ink2}">PREP KIT</text>
    <g stroke="${C.teal}" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M270 190c14 18 14 42 0 60"/>
      <path d="M314 190c-14 18-14 42 0 60"/>
      <path d="M278 202h28M274 220h36M278 238h28"/>
    </g>
    <rect x="150" y="236" width="34" height="10" rx="5" fill="#d7e6ef"/>
    <rect x="150" y="250" width="52" height="8" rx="4" fill="#e4eef4"/>
  </g>`,
  'Kit de reactivos con caja',
)

const cartucho = S(
  `<g>
    <rect x="108" y="128" width="264" height="150" rx="12" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="124" y="144" width="126" height="70" rx="7" fill="#eef6f9" stroke="#cfe0ea"/>
    <text x="187" y="170" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="11" font-weight="700" fill="${C.tealD}">REAGENT</text>
    <text x="187" y="186" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="${C.ink2}">CARTRIDGE</text>
    <g fill="#cfe0ea" stroke="#b9cede" stroke-width="1">
      ${Array.from({ length: 18 }, (_, i) => {
        const x = 150 + (i % 6) * 16
        const y = 194 + Math.floor(i / 6) * 8
        return `<rect x="${x}" y="${y}" width="10" height="4" rx="2"/>`
      }).join('\n      ')}
    </g>
    <rect x="266" y="144" width="90" height="34" rx="7" fill="${C.dark}"/>
    <rect x="274" y="156" width="74" height="10" rx="5" fill="${C.tealL}" opacity="0.8"/>
    <g fill="${C.teal}" opacity="0.75">
      ${Array.from({ length: 20 }, (_, i) => {
        const x = 270 + (i % 5) * 17
        const y = 192 + Math.floor(i / 5) * 15
        return `<circle cx="${x}" cy="${y}" r="5"/>`
      }).join('\n      ')}
    </g>
    <path d="M108 254h264" stroke="#dbe8ef" stroke-width="2"/>
    <rect x="330" y="262" width="28" height="6" rx="3" fill="#c3d7e3"/>
  </g>`,
  'Cartucho de reactivos',
)

const flowCell = S(
  `<g>
    <rect x="116" y="132" width="248" height="128" rx="10" fill="${C.dark}"/>
    <rect x="134" y="150" width="212" height="92" rx="5" fill="${C.teal}" opacity="0.22"/>
    <g fill="${C.tealL}">
      ${Array.from({ length: 40 }, (_, i) => {
        const x = 148 + (i % 8) * 24
        const y = 164 + Math.floor(i / 8) * 17
        return `<circle cx="${x}" cy="${y}" r="3"/>`
      }).join('\n      ')}
    </g>
    <g fill="${C.warn}" opacity="0.85">
      <rect x="134" y="150" width="212" height="5" rx="2.5"/>
      <rect x="134" y="237" width="212" height="5" rx="2.5"/>
      <circle cx="128" cy="146" r="3"/><circle cx="352" cy="146" r="3"/>
      <circle cx="128" cy="246" r="3"/><circle cx="352" cy="246" r="3"/>
    </g>
    <path d="M200 272h80" stroke="${C.ink2}" stroke-width="6" stroke-linecap="round" opacity="0.15"/>
  </g>`,
  'Flow cell de secuenciación',
)

const qubit = S(
  `<g>
    <rect x="118" y="168" width="150" height="86" rx="10" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="132" y="182" width="64" height="36" rx="5" fill="#0b2b33"/>
    <text x="164" y="205" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="13" font-weight="700" fill="${C.tealL}">2.4</text>
    <circle cx="228" cy="200" r="14" fill="#eef6f9" stroke="#cfe0ea"/>
    <rect x="222" y="186" width="12" height="18" rx="3" fill="${C.teal}" opacity="0.55"/>
    <g>
      <rect x="292" y="150" width="26" height="76" rx="8" fill="#e6f2f7" stroke="${C.line}" stroke-width="2"/>
      <rect x="294" y="196" width="22" height="28" rx="5" fill="${C.teal}" opacity="0.65"/>
      <rect x="288" y="138" width="34" height="16" rx="6" fill="${C.ink2}"/>
      <rect x="330" y="164" width="26" height="62" rx="8" fill="#e6f2f7" stroke="${C.line}" stroke-width="2"/>
      <rect x="332" y="200" width="22" height="24" rx="5" fill="${C.tealL}" opacity="0.75"/>
      <rect x="326" y="152" width="34" height="16" rx="6" fill="${C.ink2}"/>
    </g>
    <rect x="118" y="254" width="238" height="8" rx="4" fill="#e4eef4"/>
  </g>`,
  'Kit de cuantificación de ADN',
)

const botella = S(
  `<g>
    <rect x="168" y="112" width="144" height="182" rx="14" fill="#eaf4f7" stroke="${C.line}" stroke-width="2"/>
    <rect x="188" y="88" width="104" height="30" rx="8" fill="${C.ink2}"/>
    <rect x="196" y="96" width="88" height="8" rx="4" fill="${C.tealL}" opacity="0.55"/>
    <rect x="186" y="156" width="108" height="94" rx="6" fill="${C.white}" stroke="#d3e3ec" stroke-width="2"/>
    <text x="240" y="184" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="12" font-weight="700" fill="${C.tealD}">AMPure XP</text>
    <text x="240" y="200" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="9" fill="${C.ink2}">60 mL</text>
    <g fill="${C.teal}" opacity="0.7">
      <circle cx="212" cy="222" r="4"/><circle cx="230" cy="230" r="3.4"/>
      <circle cx="248" cy="220" r="4.4"/><circle cx="264" cy="231" r="3.2"/>
      <circle cx="220" cy="240" r="3"/><circle cx="256" cy="240" r="4"/>
    </g>
    <path d="M196 264h88" stroke="#dbe8ef" stroke-width="2"/>
  </g>`,
  'Frasco de reactivo con perlas',
)

/* ------------------------------------------------------------- consumible */

const puntas = S(
  `<g>
    <g fill="${C.teal}" opacity="0.28" stroke="${C.teal}" stroke-width="1.6">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = 142 + (i % 8) * 26
        const y = 128 + Math.floor(i / 8) * 16
        return `<path d="M${x} ${y}l7 30-14 0z"/>`
      }).join('\n      ')}
    </g>
    <rect x="120" y="196" width="240" height="78" rx="8" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="132" y="208" width="216" height="54" rx="5" fill="#eef6f9" stroke="#d3e3ec"/>
    <g fill="#c3d7e3">
      ${Array.from({ length: 24 }, (_, i) => {
        const x = 146 + (i % 8) * 26
        const y = 214 + Math.floor(i / 8) * 16
        return `<rect x="${x}" y="${y}" width="12" height="10" rx="2"/>`
      }).join('\n      ')}
    </g>
    <rect x="120" y="266" width="240" height="8" rx="4" fill="#dbe8ef"/>
  </g>`,
  'Rack de puntas de pipeta',
)

const placa = S(
  `<g>
    <path d="M104 176l136-38 136 38-136 38z" fill="#f4fafc" stroke="${C.line}" stroke-width="2"/>
    <path d="M104 176v54l136 38 136-38v-54" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <g fill="#cfe0ea" stroke="#b9cede" stroke-width="1">
      ${Array.from({ length: 48 }, (_, i) => {
        const col = i % 12
        const row = Math.floor(i / 12)
        const x = 146 + col * 16 + row * 6
        const y = 186 + row * 11 - col * 0.0
        return `<ellipse cx="${x}" cy="${y}" rx="5" ry="3.6"/>`
      }).join('\n      ')}
    </g>
    <g fill="none" stroke="${C.teal}" stroke-width="2" opacity="0.5">
      <path d="M116 206l136 38 136-38"/>
    </g>
    <text x="240" y="258" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="10" fill="${C.ink2}">96 pocillos</text>
  </g>`,
  'Placa de PCR de 96 pocillos',
)

/* --------------------------------------------------------------- servicio */

const instalacion = S(
  `<g>
    <rect x="96" y="150" width="176" height="112" rx="12" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="112" y="166" width="86" height="52" rx="6" fill="url(#pantalla)"/>
    <path d="M122 202l14-16 11 9 13-15 16 22" fill="none" stroke="${C.tealL}" stroke-width="2.4" stroke-linecap="round"/>
    <rect x="112" y="230" width="60" height="8" rx="4" fill="#d7e6ef"/>
    <g transform="translate(300 112)">
      <rect x="0" y="0" width="86" height="112" rx="8" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
      <rect x="16" y="14" width="54" height="9" rx="4.5" fill="#dbe8ef"/>
      <g stroke="${C.teal}" stroke-width="3" stroke-linecap="round" fill="none">
        <path d="M20 40l7 7 13-14"/><path d="M20 62l7 7 13-14"/><path d="M20 84l7 7 13-14"/>
      </g>
      <g stroke="#c3d7e3" stroke-width="3" stroke-linecap="round">
        <path d="M46 44h20"/><path d="M46 66h20"/><path d="M46 88h20"/>
      </g>
    </g>
    <g transform="translate(262 206)">
      <path d="M8 18a7 7 0 1 1 12 6l12 12a3 3 0 0 1-4 4L16 28A7 7 0 0 1 8 18z" fill="${C.warn}" opacity="0.85"/>
    </g>
  </g>`,
  'Instalación y validación de equipo',
)

const capacitacion = S(
  `<g>
    <rect x="128" y="106" width="224" height="132" rx="10" fill="${C.dark}"/>
    <rect x="140" y="118" width="200" height="108" rx="5" fill="#0b2b33"/>
    <path d="M156 200l28-32 22 18 26-34 30 48" fill="none" stroke="${C.tealL}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="156" y="132" width="54" height="9" rx="4.5" fill="${C.teal}" opacity="0.6"/>
    <rect x="156" y="148" width="84" height="7" rx="3.5" fill="#1c4d5e"/>
    <path d="M188 238h104l10 14H178z" fill="${C.ink2}"/>
    <g fill="${C.teal}" opacity="0.85">
      <circle cx="158" cy="286" r="15"/><path d="M138 318c0-12 9-20 20-20s20 8 20 20z"/>
      <circle cx="236" cy="286" r="15"/><path d="M216 318c0-12 9-20 20-20s20 8 20 20z"/>
    </g>
    <g fill="${C.ink2}" opacity="0.45">
      <circle cx="316" cy="290" r="12"/><path d="M300 318c0-10 7-16 16-16s16 6 16 16z"/>
    </g>
  </g>`,
  'Capacitación de usuarios',
)

const mantenimiento = S(
  `<g>
    <g transform="translate(150 132)">
      <path d="M60 0l11 10 15-3 5 14 14 6-4 15 9 12-10 11 3 15-14 5-6 14-15-4-12 9-11-10-15 3-5-14-14-6 4-15-9-12 10-11-3-15 14-5 6-14 15 4z" fill="${C.teal}" opacity="0.16" stroke="${C.teal}" stroke-width="2"/>
      <circle cx="60" cy="61" r="22" fill="#eef6f9" stroke="${C.teal}" stroke-width="2"/>
      <circle cx="60" cy="61" r="8" fill="${C.teal}" opacity="0.5"/>
    </g>
    <g transform="translate(276 176) rotate(35)">
      <path d="M12 0a12 12 0 0 1 17 15l34 34a6 6 0 0 1-8 9L21 24A12 12 0 0 1 6 9z" fill="${C.warn}" opacity="0.9"/>
      <circle cx="14" cy="8" r="4" fill="#fff" opacity="0.7"/>
    </g>
    <rect x="96" y="252" width="84" height="34" rx="8" fill="url(#metal)" stroke="${C.line}" stroke-width="2"/>
    <rect x="108" y="262" width="60" height="8" rx="4" fill="#d7e6ef"/>
    <rect x="108" y="274" width="38" height="6" rx="3" fill="#e4eef4"/>
  </g>`,
  'Mantenimiento preventivo',
)

const validacion = S(
  `<g>
    <rect x="132" y="96" width="196" height="188" rx="10" fill="${C.white}" stroke="${C.line}" stroke-width="2"/>
    <rect x="190" y="84" width="80" height="26" rx="8" fill="${C.ink2}"/>
    <g stroke="#dbe8ef" stroke-width="2"><path d="M152 136h156"/><path d="M152 160h100"/></g>
    <g>
      ${[0, 1, 2, 3].map((i) => `<rect x="${158 + i * 34}" y="${232 - [46, 70, 34, 88][i]}" width="20" height="${[46, 70, 34, 88][i]}" rx="4" fill="${i === 3 ? C.teal : C.tealL}" opacity="${i === 3 ? 0.9 : 0.55}"/>`).join('\n      ')}
    </g>
    <path d="M152 232h156" stroke="#c3d7e3" stroke-width="2"/>
    <g transform="translate(296 208)">
      <circle cx="26" cy="26" r="26" fill="${C.white}" stroke="${C.teal}" stroke-width="3"/>
      <path d="M14 27l8 8 16-18" fill="none" stroke="${C.teal}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <rect x="176" y="262" width="120" height="7" rx="3.5" fill="#e4eef4"/>
  </g>`,
  'Validación de método y desempeño',
)

const software = S(
  `<g>
    <path d="M96 214h288l-18 26H114z" fill="#e4eef4" stroke="${C.line}" stroke-width="2"/>
    <rect x="120" y="104" width="240" height="114" rx="10" fill="${C.dark}"/>
    <rect x="132" y="116" width="216" height="90" rx="4" fill="#0b2b33"/>
    <g fill="${C.teal}" opacity="0.75">
      <rect x="146" y="130" width="58" height="8" rx="4"/>
      <rect x="146" y="146" width="88" height="6" rx="3" opacity="0.6"/>
    </g>
    <g>
      <rect x="146" y="164" width="34" height="28" rx="4" fill="${C.tealL}" opacity="0.5"/>
      <rect x="190" y="172" width="34" height="20" rx="4" fill="${C.teal}" opacity="0.7"/>
      <rect x="234" y="156" width="34" height="36" rx="4" fill="${C.warn}" opacity="0.65"/>
      <rect x="278" y="166" width="34" height="26" rx="4" fill="${C.tealL}" opacity="0.8"/>
    </g>
    <g transform="translate(300 52)">
      <path d="M28 40a20 20 0 1 1 20-20 20 20 0 0 1-20 20z" fill="${C.white}" stroke="${C.teal}" stroke-width="2.5" opacity="0.95"/>
      <path d="M14 46h52l-8 10H22z" fill="${C.teal}" opacity="0.2"/>
      <path d="M22 30l8 8 16-16" fill="none" stroke="${C.teal}" stroke-width="3" stroke-linecap="round"/>
    </g>
    <rect x="196" y="240" width="88" height="6" rx="3" fill="#c3d7e3"/>
  </g>`,
  'Plataforma de análisis bioinformático',
)

/* ------------------------------------------------------------------ salida */

const productos = {
  'SEQ-001': miscq,
  'SEQ-002': minion,
  'SEQ-003': termociclador,
  'REA-001': cajaKit,
  'REA-002': cartucho,
  'REA-003': flowCell,
  'REA-004': qubit,
  'REA-005': botella,
  'CON-001': puntas,
  'CON-002': placa,
  'SRV-001': instalacion,
  'SRV-002': capacitacion,
  'SRV-003': mantenimiento,
  'SRV-004': validacion,
  'SW-001': software,
}

await mkdir(salida, { recursive: true })
for (const [sku, svg] of Object.entries(productos)) {
  const archivo = join(salida, `${sku.toLowerCase()}.svg`)
  await writeFile(archivo, svg, 'utf8')
  console.log(`ok  ${sku}  ->  media/productos/${sku.toLowerCase()}.svg`)
}
console.log(`\n${Object.keys(productos).length} imágenes generadas en ${salida}`)
