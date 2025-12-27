# ocif-js

~~Vibecoded~~ AI-written Node.js library for manipulating OpenComputers Image Format images.

## Features

-   Load OCIF images from a buffer (supports versions 5, 6, 7, and 8).
-   Save OCIF images to a buffer.
-   Create new images from scratch.
-   Get and set individual pixels.
-   Convert OCIF images to PNG format.
-   Full support for Braille and text characters.
-   Based on the original implementations in [Lua](https://github.com/IgorTimofeev/MineOS/blob/master/Libraries/Image.lua), [C++](https://github.com/Smok1e/OCIFEdit), and [Java](https://github.com/IgorTimofeev/OCIFImageConverter).

## Installation

You can install the library using npm:

```bash
npm install ocif
```

## Usage

Here is a simple example of how to use the library:

```typescript
import { OCIF } from 'ocif-js';
import * as fs from 'fs';

// Make some colorful text
const text = "God save Claude Code";

// Create a new 20x1 image
const image = new OCIF(text.length, 1);

for (let i = 0; i < text.length; i++) {
    image.setPixel(i, 0, {
        background: 0x000000,
        foreground: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff][i % 6],
        alpha: 1,
        character: text[i],
    });
}

// Convert the image to a PNG buffer
const pngBuffer = image.toPNG({ scale: 2 });
fs.writeFileSync('hello.png', pngBuffer);
console.log('Saved image to hello.png');

// Save the image to an OCIF buffer
const ocifBuffer = image.toBuffer();
fs.writeFileSync('hello.pic', ocifBuffer);
console.log('Saved image to hello.pic');

// Load an OCIF image from a file
try {
    const loadedOcifBuffer = fs.readFileSync('hello.pic');
    const loadedImage = OCIF.fromBuffer(loadedOcifBuffer);
    console.log(`Loaded image with width ${loadedImage.width} and height ${loadedImage.height}`);
} catch (error) {
    console.error('Error loading image:', error);
}
```