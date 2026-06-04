/**
 * pngHandler.js
 * Handles embedding and extracting JSON data inside PNG tEXt chunks.
 */
const PngHandler = (function() {
  'use strict';

  // CRC32 Table generation for PNG chunks
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[i] = c;
  }

  function crc32(data) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    return crc ^ 0xFFFFFFFF;
  }

  // Force convert any blob (JPEG/WebP) to a pure PNG blob
  async function convertToPNG(blob) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b), 'image/png');
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  }

  return {
    /**
     * Embeds application data into a PNG file and triggers download
     */
    async save(imageBlob, appData, filename = 'promptuner-save.png') {
      try {
        const pngBlob = await convertToPNG(imageBlob);
        const arrayBuffer = await pngBlob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        const view = new DataView(arrayBuffer);

        // Check PNG Signature
        if (view.getUint32(0) !== 0x89504E47) {
          console.error("Invalid PNG signature format");
        return false;
        }

        // Dynamically find where the IEND chunk starts
        let iendOffset = uint8.length - 12; // Fallback default
        let offset = 8;
        while (offset + 8 <= uint8.length) {
          const length = view.getUint32(offset);
          const type = new TextDecoder().decode(uint8.subarray(offset + 4, offset + 8));
          if (type === 'IEND') {
            iendOffset = offset;
            break;
          }
          offset += 8 + length + 4; // Move to next chunk
        }

        // Prepare JSON payload
        const keyword = "promptuner";
        const text = JSON.stringify({
          app: "promptuner-savefile",
          version: "1.0",
          timestamp: new Date().toISOString(),
          ...appData
        });

        const keywordBytes = new TextEncoder().encode(keyword);
        const textBytes = new TextEncoder().encode(text);

        const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length);
        chunkData.set(keywordBytes, 0);
        chunkData[keywordBytes.length] = 0; // Null separator
        chunkData.set(textBytes, keywordBytes.length + 1);

        const chunkLength = chunkData.length;
        const chunk = new Uint8Array(4 + 4 + chunkLength + 4);
        const chunkView = new DataView(chunk.buffer);

        chunkView.setUint32(0, chunkLength); // Chunk Length

        const typeBytes = new TextEncoder().encode("tEXt");
        chunk.set(typeBytes, 4); // Chunk Type
        chunk.set(chunkData, 8); // Chunk Data

        // Calculate CRC
        const crcData = chunk.subarray(4, 4 + 4 + chunkLength);
        chunkView.setUint32(8 + chunkLength, crc32(crcData));

        // Assemble Final PNG
        const beforeIend = uint8.subarray(0, iendOffset);
        const iend = uint8.subarray(iendOffset);

        const finalImage = new Uint8Array(beforeIend.length + chunk.length + iend.length);
        finalImage.set(beforeIend, 0);
        finalImage.set(chunk, beforeIend.length);
        finalImage.set(iend, beforeIend.length + chunk.length);

        // Download
        const finalBlob = new Blob([finalImage], { type: 'image/png' });
        const url = URL.createObjectURL(finalBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
      } catch (error) {
        console.error("Error saving PNG:", error);
        return false;
      }
    },

    /**
     * Extracts JSON data from a PNG file
     */
    async extract(file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const view = new DataView(arrayBuffer);
        const uint8 = new Uint8Array(arrayBuffer);

        // Validate PNG
        if (view.getUint32(0) !== 0x89504E47) {
          console.warn("File is not a valid PNG.");
          return null;
        }

        let offset = 8;
        // Safety boundary check: ensure we have at least 8 bytes left to read Length + Type
        while (offset + 8 <= uint8.length) {
          const length = view.getUint32(offset);
          const type = new TextDecoder().decode(uint8.subarray(offset + 4, offset + 8));

          if (type === 'tEXt') {
            // Safety check: ensure chunk data doesn't exceed file size
            if (offset + 8 + length > uint8.length) break;

            const data = uint8.subarray(offset + 8, offset + 8 + length);
            const nullIdx = data.indexOf(0);

            if (nullIdx !== -1) {
              const keyword = new TextDecoder().decode(data.subarray(0, nullIdx));
              if (keyword === 'promptuner') {
                const text = new TextDecoder().decode(data.subarray(nullIdx + 1));
                try {
                  return JSON.parse(text); // Return if successful
                } catch (parseError) {
                  console.error("JSON Parse Error in tEXt chunk:", parseError);
                  return null;
                }
              }
            }
          }

          if (type === 'IEND') break;

          // Move to next chunk (Length: 4, Type: 4, Data: length, CRC: 4)
          offset += 8 + length + 4;
        }

        return null; // Not found
      } catch (e) {
        console.error("Extraction error (File might be corrupted):", e);
        return null;
      }
    }
  };
})();