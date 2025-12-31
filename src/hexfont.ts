import * as fs from 'fs'
import * as path from 'path'
import { PNG } from 'pngjs'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const GLYPH_WIDTH = 8
export const GLYPH_HEIGHT = 16
export const GLYPH_BYTELENGTH = 16

export class Glyph {
    public readonly data: Buffer
    public readonly byteLength: number

    constructor(data: Buffer) {
        this.data = data
        this.byteLength = data.length
    }

    public getPixel(x: number, y: number): boolean {
        const isWide = this.byteLength > GLYPH_BYTELENGTH
        const width = isWide ? GLYPH_WIDTH * 2 : GLYPH_WIDTH
        if (x < 0 || x >= width || y < 0 || y >= GLYPH_HEIGHT) {
            return false
        }
        const byteIndex = Math.floor((y * width + x) / 8)
        const bitIndex = 7 - ((y * width + x) % 8)
        return ((this.data[byteIndex] >> bitIndex) & 1) === 1
    }
}

export class HexFont {
    private readonly glyphs = new Map<number, Glyph>()
    private static instance: HexFont

    constructor(fontData?: string) {
        if (fontData) {
            this.load(fontData)
        } else {
            if (!HexFont.instance) {
                const fontPath = path.join(__dirname, 'unscii.hex')
                const defaultFontData = fs.readFileSync(fontPath, 'utf-8')
                this.load(defaultFontData)
                HexFont.instance = this
            }
            return HexFont.instance
        }
    }

    public static getInstance(): HexFont {
        if (!HexFont.instance) {
            HexFont.instance = new HexFont()
        }
        return HexFont.instance
    }

    private load(fontData: string): void {
        const lines = fontData.split('\n')
        for (const line of lines) {
            if (line.trim() === '') {
                continue
            }
            const parts = line.split(':')
            if (parts.length !== 2) {
                continue
            }
            const charCode = parseInt(parts[0], 16)
            const glyphData = Buffer.from(parts[1], 'hex')
            this.glyphs.set(charCode, new Glyph(glyphData))
        }
    }

    public getGlyph(char: string): Glyph | undefined {
        const charCode = char.charCodeAt(0)
        return this.glyphs.get(charCode)
    }

    public rasterize(
        char: string,
        fgColor: number,
        bgColor: number,
        alpha: number
    ): PNG {
        const glyph = this.getGlyph(char) ?? this.getGlyph(' ')
        const isWide = glyph!.byteLength > GLYPH_BYTELENGTH
        const width = isWide ? GLYPH_WIDTH * 2 : GLYPH_WIDTH
        const png = new PNG({ width, height: GLYPH_HEIGHT })

        const fgR = (fgColor >> 16) & 0xff
        const fgG = (fgColor >> 8) & 0xff
        const fgB = fgColor & 0xff

        const bgR = (bgColor >> 16) & 0xff
        const bgG = (bgColor >> 8) & 0xff
        const bgB = bgColor & 0xff
        const bgA = Math.floor((1 - alpha) * 255)

        for (let y = 0; y < GLYPH_HEIGHT; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (width * y + x) << 2
                const isSet = glyph!.getPixel(x, y)

                if (isSet) {
                    png.data[idx] = fgR
                    png.data[idx + 1] = fgG
                    png.data[idx + 2] = fgB
                    png.data[idx + 3] = 0xff
                } else {
                    png.data[idx] = bgR
                    png.data[idx + 1] = bgG
                    png.data[idx + 2] = bgB
                    png.data[idx + 3] = bgA
                }
            }
        }
        return png
    }
}
