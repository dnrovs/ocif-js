import { describe, it, expect, beforeAll } from 'vitest'
import {
    HexFont,
    Glyph,
    GLYPH_WIDTH,
    GLYPH_HEIGHT,
    GLYPH_BYTELENGTH
} from '../src/hexfont'

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

    it('should handle out-of-bounds pixel requests for regular glyphs', () => {
        const glyph = font.getGlyph('a')
        expect(glyph?.getPixel(-1, -1)).toBe(false)
        expect(glyph?.getPixel(GLYPH_WIDTH, GLYPH_HEIGHT)).toBe(false)
        expect(glyph?.getPixel(-1, 0)).toBe(false)
        expect(glyph?.getPixel(GLYPH_WIDTH, 0)).toBe(false)
        expect(glyph?.getPixel(0, -1)).toBe(false)
        expect(glyph?.getPixel(0, GLYPH_HEIGHT)).toBe(false)
    })

    it('should handle out-of-bounds pixel requests for wide glyphs', () => {
        // Assuming a wide glyph exists for '⌛'
        const wideGlyph = font.getGlyph('⌛')
        if (wideGlyph) {
            expect(wideGlyph.byteLength).toBeGreaterThan(GLYPH_BYTELENGTH)
            expect(wideGlyph?.getPixel(-1, -1)).toBe(false)
            expect(wideGlyph?.getPixel(GLYPH_WIDTH * 2, GLYPH_HEIGHT)).toBe(
                false
            )
        }
    })

    it('should handle malformed font data with lines not splitting into two parts', () => {
        const malformedFontData = `
0020:00000000000000000000000000000000
this is a malformed line without a colon
0021:181818181818181800001818000000
`
        const malformedFont = new HexFont(malformedFontData)
        // Check that valid glyphs are still loaded
        expect(malformedFont.getGlyph(' ')).toBeInstanceOf(Glyph)
        expect(malformedFont.getGlyph('!')).toBeInstanceOf(Glyph)
        // Optionally, check that the malformed line was skipped (harder to test directly)
    })

    it('should return the existing instance if constructor is called again without fontData', () => {
        const instance1 = new HexFont() // This is the first instance created in beforeAll
        const instance2 = new HexFont() // Calling constructor again without fontData
        expect(instance1).toBe(instance2)
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
