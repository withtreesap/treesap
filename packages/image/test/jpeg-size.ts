const START_OF_IMAGE = 0xffd8;
const START_OF_SCAN = 0xffda;
const END_OF_IMAGE = 0xffd9;
const START_OF_FRAME_MARKERS = new Set([
  0xffc0,
  0xffc1,
  0xffc2,
  0xffc3,
  0xffc5,
  0xffc6,
  0xffc7,
  0xffc9,
  0xffca,
  0xffcb,
  0xffcd,
  0xffce,
  0xffcf,
]);

export interface JpegSize {
  width: number;
  height: number;
}

export function readJpegSize(imageData: Buffer): JpegSize {
  if (imageData.readUInt16BE(0) !== START_OF_IMAGE) {
    throw new Error("Expected a JPEG image");
  }

  let offset = 2;

  while (offset + 4 <= imageData.length) {
    const marker = imageData.readUInt16BE(offset);
    offset += 2;

    if (marker === START_OF_SCAN || marker === END_OF_IMAGE) {
      break;
    }

    const segmentLength = imageData.readUInt16BE(offset);

    if (segmentLength < 2 || offset + segmentLength > imageData.length) {
      throw new Error("Invalid JPEG segment length");
    }

    if (START_OF_FRAME_MARKERS.has(marker)) {
      return {
        height: imageData.readUInt16BE(offset + 3),
        width: imageData.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  throw new Error("JPEG dimensions not found");
}
