const BRAILLE_BEGIN = 0x2800
const BRAILLE_END = 0x28ff
const BRAILLE_EMPTY_CHARACTER = 0x2800

const BrailleAlternatives: { [key: number]: number } = {
    [' '.charCodeAt(0)]: BRAILLE_EMPTY_CHARACTER,
    [0x2584]: 0x28e4
}

function normalizeBrailleCharacter(ch: number): number {
    const alternative = BrailleAlternatives[ch]
    if (alternative !== undefined) {
        return alternative
    }
    if (ch >= BRAILLE_BEGIN && ch <= BRAILLE_END) {
        return ch
    }
    return BRAILLE_EMPTY_CHARACTER
}

function brailleBit(x: number, y: number): number {
    return y < 3 ? 3 * x + y : 6 + x
}

export function checkBrailleDot(ch: number, x: number, y: number): boolean {
    const normalizedCh = normalizeBrailleCharacter(ch)
    return (((normalizedCh - BRAILLE_BEGIN) >> brailleBit(x, y)) & 1) === 1
}

export function setBrailleDot(
    ch: number,
    x: number,
    y: number,
    dot: boolean
): number {
    const normalizedCh = normalizeBrailleCharacter(ch)
    const bit = brailleBit(x, y)
    const dotValue = dot ? 1 : 0
    return (
        BRAILLE_BEGIN +
        (((normalizedCh - BRAILLE_BEGIN) & ~(1 << bit)) | (dotValue << bit))
    )
}

/**
 * Converts a 2x4 matrix of booleans to a Braille character.
 * @param dots The 2x4 matrix of booleans representing the braille dots.
 * @returns The Braille character code.
 */
export function dotsToBraille(dots: boolean[][]): number {
    let charCode = BRAILLE_BEGIN
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 2; x++) {
            if (dots[y][x]) {
                charCode |= 1 << brailleBit(x, y)
            }
        }
    }
    return charCode
}
