import { describe, it, expect } from 'vitest'
import { toRGB, fromRGB, findClosestColor, palette } from '../src/palette'

describe('palette', () => {
    it('should convert a color to RGB and back', () => {
        const color = 0xff8000
        const rgb = toRGB(color)
        expect(rgb).toEqual({ r: 255, g: 128, b: 0 })
        const convertedColor = fromRGB(rgb)
        expect(convertedColor).toBe(color)
    })

    it('should find the closest color in the palette', () => {
        const color = 0xfefefe // Almost white
        const closestIndex = findClosestColor(color)
        expect(closestIndex).toBe(palette.indexOf(0xffffff))
    })

    it('should find black as the closest color', () => {
        const color = 0x010101 // Almost black
        const closestIndex = findClosestColor(color)
        expect(closestIndex).toBe(palette.indexOf(0x000000))
    })

    it('should return the same color if it is in the palette', () => {
        for (let i = 0; i < palette.length; i++) {
            const color = palette[i]
            const closestIndex = findClosestColor(color)
            expect(closestIndex).toBe(i)
        }
    })
})
