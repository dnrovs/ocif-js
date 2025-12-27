import { describe, it, expect } from 'vitest'
import { checkBrailleDot, setBrailleDot, dotsToBraille } from '../src/braille'

describe('braille', () => {
    it('should set and check braille dots correctly', () => {
        let charCode = 0x2800 // Braille pattern blank
        charCode = setBrailleDot(charCode, 0, 0, true)
        expect(checkBrailleDot(charCode, 0, 0)).toBe(true)
        expect(checkBrailleDot(charCode, 1, 0)).toBe(false)

        charCode = setBrailleDot(charCode, 1, 3, true)
        expect(checkBrailleDot(charCode, 1, 3)).toBe(true)

        charCode = setBrailleDot(charCode, 0, 0, false)
        expect(checkBrailleDot(charCode, 0, 0)).toBe(false)
    })

    it('should handle an existing braille character', () => {
        let charCode = 0x2801 // Braille pattern dots-1
        expect(checkBrailleDot(charCode, 0, 0)).toBe(true)
        charCode = setBrailleDot(charCode, 0, 1, true)
        expect(checkBrailleDot(charCode, 0, 1)).toBe(true)
    })

    it('should handle alternative characters', () => {
        let charCode = ' '.charCodeAt(0)
        charCode = setBrailleDot(charCode, 0, 0, true)
        expect(checkBrailleDot(charCode, 0, 0)).toBe(true)
    })

    it('should handle non-braille characters', () => {
        let charCode = 'a'.charCodeAt(0)
        charCode = setBrailleDot(charCode, 0, 0, true)
        expect(checkBrailleDot(charCode, 0, 0)).toBe(true)
        expect(checkBrailleDot(charCode, 1, 0)).toBe(false)
    })

    it('should convert a dot matrix to a braille character', () => {
        const dots = [
            [true, false],
            [false, true],
            [false, false],
            [false, false]
        ]
        const charCode = dotsToBraille(dots)
        expect(checkBrailleDot(charCode, 0, 0)).toBe(true)
        expect(checkBrailleDot(charCode, 1, 1)).toBe(true)
        expect(checkBrailleDot(charCode, 0, 1)).toBe(false)
    })
})
