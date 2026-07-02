export interface HeroElement {
  visible: boolean
  x: number       // 0-100, % from left, center-anchored
  y: number       // 0-100, % from top, center-anchored
  scale: number   // multiplier on base font size (0.5–3.0)
  rotation: number // degrees, -45 to 45
}

export type HeroElementKey = 'title' | 'eventType' | 'date' | 'time' | 'location'

export interface HeroConfig {
  gradientOpacity: number // 0–1
  focalX?: number         // 0–100, centre horizontal du crop (objectPosition X)
  focalY?: number         // 0–100, centre vertical du crop (objectPosition Y)
  nativeW?: number        // largeur naturelle de la photo (pour sizing mobile sans crop)
  nativeH?: number        // hauteur naturelle de la photo
  title: HeroElement
  eventType: HeroElement
  date: HeroElement
  time: HeroElement
  location: HeroElement
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  gradientOpacity: 0.85,
  focalX: 50,
  focalY: 50,
  title:     { visible: true,  x: 50, y: 72, scale: 1.0, rotation: 0 },
  eventType: { visible: true,  x: 50, y: 82, scale: 1.0, rotation: 0 },
  date:      { visible: true,  x: 50, y: 88, scale: 1.0, rotation: 0 },
  time:      { visible: false, x: 50, y: 92, scale: 1.0, rotation: 0 },
  location:  { visible: false, x: 50, y: 95, scale: 1.0, rotation: 0 },
}

export const ELEMENT_LABELS: Record<HeroElementKey, string> = {
  title:     'Titre',
  eventType: 'Type d\'événement',
  date:      'Date',
  time:      'Heure',
  location:  'Lieu',
}

/**
 * Tailles de base en svh (% de la hauteur de l'écran).
 * Utiliser svh (pas vw) garantit que le ratio preview/vitrine est constant
 * quelle que soit la largeur de l'écran — le preview portrait (9:16) est
 * proportionnellement identique au mobile plein écran.
 */
export const BASE_FONT_SVH: Record<HeroElementKey, number> = {
  title:     5.5,
  eventType: 1.3,
  date:      1.3,
  time:      1.3,
  location:  1.2,
}

/**
 * Taille en px dans un conteneur de hauteur connue (le preview de l'éditeur).
 * On utilise la HAUTEUR (pas la largeur) car on passe en portrait 9:16.
 */
export function previewFontPx(key: HeroElementKey, scale: number, containerHeightPx: number): number {
  return (BASE_FONT_SVH[key] / 100) * containerHeightPx * scale
}
