import { Pixel } from './types'
import { BufferReader } from './io'
import { palette, findClosestColor } from './palette'
import { HexFont, GLYPH_WIDTH, GLYPH_HEIGHT } from './hexfont'
import { PNG } from 'pngjs'

/**
 * Represents an OCIF (OpenComputers Image Format) image.
 * This class provides methods to create, manipulate, load, and save OCIF images.
 */
export class OCIF {
    public width: number
    public height: number
    public pixels: Pixel[]

    /**
     * Creates a new OCIF image.
     * @param width The width of the image.
     * @param height The height of the image.
     * @param fill Optional. A pixel for filling the image. Defaults to a black background, white foreground, and a space character.
     */
    constructor(width: number, height: number, fill: Partial<Pixel> = {}) {
        this.width = width
        this.height = height
        this.pixels = new Array(width * height)
        const fillPixel: Pixel = {
            background: fill.background ?? 0x000000,
            foreground: fill.foreground ?? 0xffffff,
            alpha: fill.alpha ?? 1.0,
            character: fill.character ?? ' '
        }
        for (let i = 0; i < this.pixels.length; i++) {
            this.pixels[i] = { ...fillPixel }
        }
    }

    /**
     * Gets the pixel at the specified coordinates.
     * @param x The x-coordinate of the pixel.
     * @param y The y-coordinate of the pixel.
     * @returns The pixel at the specified coordinates, or undefined if the coordinates are out of bounds.
     */
    public getPixel(x: number, y: number): Pixel | undefined {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return undefined
        }
        return this.pixels[y * this.width + x]
    }

    /**
     * Sets the pixel at the specified coordinates.
     * @param x The x-coordinate of the pixel.
     * @param y The y-coordinate of the pixel.
     * @param pixel The pixel to set.
     */
    public setPixel(x: number, y: number, pixel: Pixel): void {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return
        }
        this.pixels[y * this.width + x] = pixel
    }

    /**
     * Loads an OCIF image from a buffer.
     * @param buffer The buffer containing the OCIF image data.
     * @returns A new OCIF instance.
     */
    public static fromBuffer(buffer: Buffer): OCIF {
        const reader = new BufferReader(buffer)
        const signature = reader.readString(4, 'ascii')
        if (signature !== 'OCIF') {
            throw new Error('Invalid OCIF signature')
        }

        const encodingMethod = reader.readUInt8()
        if (encodingMethod < 5 || encodingMethod > 8) {
            throw new Error(`Unsupported encoding method: ${encodingMethod}`)
        }

        const is7 = encodingMethod >= 7 ? 1 : 0
        const is8 = encodingMethod >= 8 ? 1 : 0

        let width, height

        if (encodingMethod === 5) {
            width = reader.readUInt16BE()
            height = reader.readUInt16BE()
        } else {
            width = reader.readUInt8() + is8
            height = reader.readUInt8() + is8
        }

        const image = new OCIF(width, height)

        if (encodingMethod === 5) {
            for (let i = 0; i < width * height; i++) {
                const background = palette[reader.readUInt8()]
                const foreground = palette[reader.readUInt8()]
                const alpha = reader.readUInt8() / 255
                const char = reader.readUnicodeChar()
                image.pixels[i] = {
                    background,
                    foreground,
                    alpha,
                    character: char
                }
            }
        } else if (encodingMethod >= 6 && encodingMethod <= 8) {
            const alphaCount = reader.readUInt8() + is7
            for (let i = 0; i < alphaCount; i++) {
                const currentAlpha = reader.readUInt8() / 255
                const charCount = reader.readUInt16BE() + is7
                for (let j = 0; j < charCount; j++) {
                    const currentChar = reader.readUnicodeChar()
                    const backgroundCount = reader.readUInt8() + is7
                    for (let k = 0; k < backgroundCount; k++) {
                        const currentBg = palette[reader.readUInt8()]
                        const foregroundCount = reader.readUInt8() + is7
                        for (let l = 0; l < foregroundCount; l++) {
                            const currentFg = palette[reader.readUInt8()]
                            const yCount = reader.readUInt8() + is7
                            for (let m = 0; m < yCount; m++) {
                                const yFromFile = reader.readUInt8()
                                const y = yFromFile + is8
                                const xCount = reader.readUInt8() + is7
                                for (let n = 0; n < xCount; n++) {
                                    const xFromFile = reader.readUInt8()
                                    const x = xFromFile + is8
                                    image.setPixel(x - 1, y - 1, {
                                        background: currentBg,
                                        foreground: currentFg,
                                        alpha: currentAlpha,
                                        character: currentChar
                                    })
                                }
                            }
                        }
                    }
                }
            }
        }

        return image
    }

    /**
     * Saves the OCIF image to a buffer.
     * @param encodingMethod The OCIF encoding method to use. Can be 5, 6, 7, or 8. Defaults to 8.
     * @returns A buffer containing the OCIF image data.
     */
    public toBuffer(encodingMethod = 8): Buffer {
        const is7 = encodingMethod >= 7 ? 1 : 0
        const is8 = encodingMethod >= 8 ? 1 : 0

        const writer = new BufferWriter()
        writer.writeString('OCIF', 'ascii')
        writer.writeUInt8(encodingMethod)

        if (encodingMethod === 5) {
            writer.writeUInt16BE(this.width)
            writer.writeUInt16BE(this.height)
            for (const pixel of this.pixels) {
                writer.writeUInt8(findClosestColor(pixel.background))
                writer.writeUInt8(findClosestColor(pixel.foreground))
                writer.writeUInt8(Math.floor(pixel.alpha * 255))
                writer.writeString(pixel.character)
            }
        } else if (encodingMethod >= 6 && encodingMethod <= 8) {
            writer.writeUInt8(this.width - is8)
            writer.writeUInt8(this.height - is8)

            const grouped = new Map<
                number,
                Map<string, Map<number, Map<number, Map<number, number[]>>>>
            >()

            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const pixel = this.getPixel(x, y)!
                    const alpha = Math.floor(pixel.alpha * 255)
                    const char = pixel.character
                    const bg = findClosestColor(pixel.background)
                    const fg = findClosestColor(pixel.foreground)

                    if (!grouped.has(alpha)) grouped.set(alpha, new Map())
                    if (!grouped.get(alpha)!.has(char))
                        grouped.get(alpha)!.set(char, new Map())
                    if (!grouped.get(alpha)!.get(char)!.has(bg))
                        grouped.get(alpha)!.get(char)!.set(bg, new Map())
                    if (!grouped.get(alpha)!.get(char)!.get(bg)!.has(fg))
                        grouped
                            .get(alpha)!
                            .get(char)!
                            .get(bg)!
                            .set(fg, new Map())
                    if (
                        !grouped.get(alpha)!.get(char)!.get(bg)!.get(fg)!.has(y)
                    )
                        grouped
                            .get(alpha)!
                            .get(char)!
                            .get(bg)!
                            .get(fg)!
                            .set(y, [])

                    grouped
                        .get(alpha)!
                        .get(char)!
                        .get(bg)!
                        .get(fg)!
                        .get(y)!
                        .push(x)
                }
            }

            writer.writeUInt8(grouped.size - is7)
            for (const [alpha, chars] of grouped) {
                writer.writeUInt8(alpha)
                writer.writeUInt16BE(chars.size - is7)
                for (const [char, bgs] of chars) {
                    writer.writeString(char)
                    writer.writeUInt8(bgs.size - is7)
                    for (const [bg, fgs] of bgs) {
                        writer.writeUInt8(bg)
                        writer.writeUInt8(fgs.size - is7)
                        for (const [fg, ys] of fgs) {
                            writer.writeUInt8(fg)
                            writer.writeUInt8(ys.size - is7)
                            for (const [y, xs] of ys) {
                                writer.writeUInt8(y + 1 - is8)
                                writer.writeUInt8(xs.length - is7)
                                for (const x of xs) {
                                    writer.writeUInt8(x + 1 - is8)
                                }
                            }
                        }
                    }
                }
            }
        } else {
            throw new Error(`Unsupported encoding method: ${encodingMethod}`)
        }

        return writer.getBuffer()
    }

    /**
     * Converts the OCIF image to a PNG buffer.
     * @param scale The scale factor for the output PNG. Defaults to 1.
     * @returns A buffer containing the PNG image data.
     */
    public toPNG(scale = 1): Buffer {
        if (!Number.isInteger(scale) || scale < 1) {
            throw new Error(
                'Scale must be an integer greater than or equal to 1.'
            )
        }

        const png = new PNG({
            width: Math.floor(this.width * GLYPH_WIDTH * scale),
            height: Math.floor(this.height * GLYPH_HEIGHT * scale)
        })

        const font = HexFont.getInstance()

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pixel = this.getPixel(x, y)
                if (pixel) {
                    const charPng = font.rasterize(
                        pixel.character,
                        pixel.foreground,
                        pixel.background,
                        pixel.alpha
                    )

                    const glyphWidthScaled = GLYPH_WIDTH * scale
                    const glyphHeightScaled = GLYPH_HEIGHT * scale

                    const startX = Math.floor(x * glyphWidthScaled)
                    const startY = Math.floor(y * glyphHeightScaled)

                    const endX = Math.floor((x + 1) * glyphWidthScaled)
                    const endY = Math.floor((y + 1) * glyphHeightScaled)

                    for (let py = startY; py < endY; py++) {
                        for (let px = startX; px < endX; px++) {
                            if (
                                px < 0 ||
                                px >= png.width ||
                                py < 0 ||
                                py >= png.height
                            )
                                continue

                            const srcX = Math.min(
                                GLYPH_WIDTH - 1,
                                Math.floor((px - startX) / scale)
                            )
                            const srcY = Math.min(
                                GLYPH_HEIGHT - 1,
                                Math.floor((py - startY) / scale)
                            )

                            const srcIdx = (charPng.width * srcY + srcX) << 2
                            const dstIdx = (png.width * py + px) << 2

                            charPng.data.copy(
                                png.data,
                                dstIdx,
                                srcIdx,
                                srcIdx + 4
                            )
                        }
                    }
                }
            }
        }

        return PNG.sync.write(png)
    }
}

class BufferWriter {
    private parts: Buffer[] = []

    writeUInt8(value: number) {
        this.parts.push(Buffer.from([value]))
    }

    writeUInt16BE(value: number) {
        const buf = Buffer.alloc(2)
        buf.writeUInt16BE(value, 0)
        this.parts.push(buf)
    }

    writeString(value: string, encoding: BufferEncoding = 'utf-8') {
        this.parts.push(Buffer.from(value, encoding))
    }

    getBuffer(): Buffer {
        return Buffer.concat(this.parts)
    }
}
