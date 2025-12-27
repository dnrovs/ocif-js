import { describe, it, expect, beforeAll } from 'vitest'
import { HexFont, Glyph, GLYPH_WIDTH, GLYPH_HEIGHT } from '../src/hexfont'

describe('HexFont', () => {
    let font: HexFont

    beforeAll(() => {
        font = new HexFont()
    })

    it('should load the font and get a glyph', () => {
        const glyph = font.getGlyph('a')
        expect(glyph).toBeInstanceOf(Glyph)
        expect(glyph?.data.length).toBe(16)
    })

    it('should return undefined for a missing glyph', () => {
        const glyph = font.getGlyph('\u{1F600}') // Grinning face is not in the font
        expect(glyph).toBeUndefined()
    })

    it('should handle malformed font data', () => {
        const malformedFontData = `
0020:00000000000000000000000000000000

malformed line
0021:181818181818181800001818000000
`
        const malformedFont = new HexFont(malformedFontData)
        expect(malformedFont.getGlyph(' ')).toBeInstanceOf(Glyph)
        expect(malformedFont.getGlyph('!')).toBeInstanceOf(Glyph)
    })

    it('should get a pixel from a glyph', () => {
        const glyph = font.getGlyph('a')
        // Assuming the top-left pixel of 'a' is off based on the font data.
        expect(glyph?.getPixel(0, 0)).toBe(false)
    })

    it('should handle out-of-bounds pixel requests', () => {
        const glyph = font.getGlyph('a')
        expect(glyph?.getPixel(-1, -1)).toBe(false)
        expect(glyph?.getPixel(GLYPH_WIDTH, GLYPH_HEIGHT)).toBe(false)
        expect(glyph?.getPixel(-1, 0)).toBe(false)
        expect(glyph?.getPixel(GLYPH_WIDTH, 0)).toBe(false)
        expect(glyph?.getPixel(0, -1)).toBe(false)
        expect(glyph?.getPixel(0, GLYPH_HEIGHT)).toBe(false)
    })

    it('should get the same instance with getInstance', () => {
        const instance1 = HexFont.getInstance()
        const instance2 = HexFont.getInstance()
        expect(instance1).toBe(instance2)
    })

    it('should rasterize a character', () => {
        const png = font.rasterize('a', 0xffffff, 0x000000, 1.0)
        expect(png.width).toBe(GLYPH_WIDTH)
        expect(png.height).toBe(GLYPH_HEIGHT)
    })
})
