import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/** Renderiza markdown a HTML seguro (el saneado se hace en el cliente, nunca en la BD). */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown ?? '', { async: false }) as string
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

export interface HighlightPart {
  text: string
  match: boolean
}

function normalizeWord(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

/**
 * Divide un texto en fragmentos para resaltar los términos buscados (sin usar `v-html`).
 * Compara palabra a palabra e ignora tildes y mayúsculas, igual que la búsqueda del backend.
 */
export function highlightParts(text: string, query: string): HighlightPart[] {
  const terms = query.trim().split(/\s+/).filter(Boolean).map(normalizeWord)

  if (!terms.length || !text) {
    return [{ text, match: false }]
  }

  return text
    .split(/(\s+)/)
    .filter((part) => part !== '')
    .map((part) => {
      const word = normalizeWord(part.replace(/[^\p{L}\p{N}]+/gu, ''))
      return { text: part, match: word.length > 0 && terms.includes(word) }
    })
}
