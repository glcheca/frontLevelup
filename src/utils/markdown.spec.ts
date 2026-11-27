import { describe, expect, it } from 'vitest'
import { highlightParts, renderMarkdown } from './markdown'

describe('markdown', () => {
  it('renderiza markdown básico', () => {
    const html = renderMarkdown('## Título\n\nTexto con **negrita**.')
    expect(html).toContain('<h2>Título</h2>')
    expect(html).toContain('<strong>negrita</strong>')
  })

  it('elimina scripts y manejadores peligrosos', () => {
    const html = renderMarkdown('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('resalta todos los términos sin distinguir mayúsculas', () => {
    const parts = highlightParts('Examen final de Álgebra', 'examen algebra')
    expect(parts.filter((part) => part.match).map((part) => part.text)).toEqual([
      'Examen',
      'Álgebra',
    ])
    expect(parts.map((part) => part.text).join('')).toBe('Examen final de Álgebra')
  })

  it('devuelve el texto intacto sin búsqueda', () => {
    expect(highlightParts('Contenido', '')).toEqual([{ text: 'Contenido', match: false }])
  })
})
