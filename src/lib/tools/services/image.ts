import { ToolServiceFn, ProcessResult } from "./index";

const handleImageCompress: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const quality = Number(settings.quality) || 80;

  const logs = [
    `[SYSTEM] Spawning image optimization engine...`,
    `[WORKER] Uploaded image size: ${(file.size / 1024).toFixed(1)} KB`,
  ];

  try {
    const { Jimp } = await import("jimp");

    logs.push(`[WORKER] Decoding image pixel matrices for '${file.name}'...`);
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] Resolving image dimensions: ${image.width}x${image.height}px.`);

    // Determine mime type and target extension based on file name
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    let mimeType: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg";
    if (ext === ".png") {
      mimeType = "image/png";
    } else if (ext === ".webp") {
      mimeType = "image/webp";
    }

    logs.push(`[WORKER] Applying lossy compression with quality factor: ${quality}%...`);
    
    // In Jimp, getBuffer takes the mime type and options object: { quality }
    const compressedBuffer = await image.getBuffer(mimeType as any, { quality });

    const compressionRatio = ((1 - compressedBuffer.length / file.size) * 100).toFixed(1);
    logs.push(`[SYSTEM] Compression complete. Size reduced from ${(file.size / 1024).toFixed(1)} KB to ${(compressedBuffer.length / 1024).toFixed(1)} KB (Reduced by ${compressionRatio}%).`);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_compressed${ext}`;
    const downloadUrl = `data:${mimeType};base64,${compressedBuffer.toString("base64")}`;

    return {
      success: true,
      outputFileName,
      outputFileSize: compressedBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error compressing image:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Optimization failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to compress the image asset.",
    };
  }
};

const handleBgRemover: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const logs = [
    `[SYSTEM] Opening image and caching buffer maps...`,
    `[WORKER] Uploaded image size: ${(file.size / 1024).toFixed(1)} KB`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] Resolving image canvas bounds: ${image.width}x${image.height}px.`);
    logs.push(`[WORKER] Sampling edge pixel color values...`);

    // Sample the color of the 4 corner pixels to detect the backdrop color
    const corners = [
      image.getPixelColor(0, 0),
      image.getPixelColor(image.width - 1, 0),
      image.getPixelColor(0, image.height - 1),
      image.getPixelColor(image.width - 1, image.height - 1)
    ];

    // Decode RGBA of the sampled color. Top-left corner is our reference background color.
    const refColor = corners[0];
    const refR = (refColor >> 24) & 0xff;
    const refG = (refColor >> 16) & 0xff;
    const refB = (refColor >> 8) & 0xff;

    logs.push(`[WORKER] Detected background color signature: RGB(${refR}, ${refG}, ${refB}).`);
    logs.push(`[WORKER] Removing background segments (Tolerance: 40)...`);

    let removedCount = 0;
    // Scan every pixel and set alpha to 0 if within threshold distance
    image.scan(0, 0, image.width, image.height, function (x, y, idx) {
      const r = image.bitmap.data[idx];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];

      const distance = Math.sqrt(
        Math.pow(r - refR, 2) + Math.pow(g - refG, 2) + Math.pow(b - refB, 2)
      );

      if (distance < 40) {
        image.bitmap.data[idx + 3] = 0; // Alpha channel to fully transparent
        removedCount++;
      }
    });

    const percentRemoved = ((removedCount / (image.width * image.height)) * 100).toFixed(1);
    logs.push(`[WORKER] Removed backdrop pixels: ${removedCount} (${percentRemoved}% of total canvas).`);

    // Output transparent format must be PNG
    logs.push(`[SYSTEM] Compiling edge refinement transparency map to PNG binary...`);
    const pngBuffer = await image.getBuffer("image/png" as any);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_no-bg.png`;
    const downloadUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    return {
      success: true,
      outputFileName,
      outputFileSize: pngBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error removing image background:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Background removal failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to remove background from image.",
    };
  }
};

const handleImageResize: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const width = Number(settings.width) || 1024;
  const height = Number(settings.height) || 768;
  const maintainAspectRatio = settings.maintainAspectRatio !== false;

  const logs = [
    `[SYSTEM] Spawning image resizer engine...`,
    `[WORKER] Source image: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] Original resolution: ${image.width}x${image.height}px.`);

    let targetWidth = width;
    let targetHeight = height;

    if (maintainAspectRatio) {
      const ratio = image.width / image.height;
      if (targetWidth / targetHeight > ratio) {
        targetWidth = Math.round(targetHeight * ratio);
      } else {
        targetHeight = Math.round(targetWidth / ratio);
      }
      logs.push(`[WORKER] Locked aspect ratio: resolved target dimensions to ${targetWidth}x${targetHeight}px.`);
    } else {
      logs.push(`[WORKER] Resolved target dimensions: ${targetWidth}x${targetHeight}px.`);
    }

    logs.push(`[WORKER] Interpolating pixels using bilinear resampling...`);
    image.resize({ w: targetWidth, h: targetHeight });

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";

    const resizedBuffer = await image.getBuffer(mimeType as any);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_resized${ext}`;
    const downloadUrl = `data:${mimeType};base64,${resizedBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] Resizing complete. Rescaled image ready for download.`);

    return {
      success: true,
      outputFileName,
      outputFileSize: resizedBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error resizing image:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Resizing failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to resize the image asset.",
    };
  }
};

const handleImageCrop: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const aspectRatio = settings.aspectRatio || "free";

  const logs = [
    `[SYSTEM] Spawning image cropper engine...`,
    `[WORKER] Source image: '${file.name}'`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] Canvas boundaries: ${image.width}x${image.height}px.`);

    let x = Number(settings.cropX);
    let y = Number(settings.cropY);
    let w = Number(settings.cropWidth);
    let h = Number(settings.cropHeight);

    const isManualCrop = !isNaN(x) && !isNaN(y) && !isNaN(w) && !isNaN(h) && w > 0 && h > 0;

    if (isManualCrop) {
      // Bounds constraints to prevent jimp errors
      x = Math.max(0, Math.min(image.width - 1, x));
      y = Math.max(0, Math.min(image.height - 1, y));
      w = Math.max(1, Math.min(image.width - x, w));
      h = Math.max(1, Math.min(image.height - y, h));

      logs.push(`[WORKER] Applying manual crop box: offset-x=${x}, offset-y=${y}, width=${w}px, height=${h}px.`);
    } else {
      logs.push(`[WORKER] Computing crop box dimensions for preset aspect ratio: ${aspectRatio}...`);

      let targetRatio = image.width / image.height;
      if (aspectRatio === "1:1 square") targetRatio = 1;
      else if (aspectRatio === "16:9 cinematic") targetRatio = 16 / 9;
      else if (aspectRatio === "4:3 standard") targetRatio = 4 / 3;
      else if (aspectRatio === "9:16 mobile") targetRatio = 9 / 16;

      w = image.width;
      h = image.height;

      if (aspectRatio !== "free") {
        if (image.width / image.height > targetRatio) {
          w = Math.round(image.height * targetRatio);
        } else {
          h = Math.round(image.width / targetRatio);
        }
      } else {
        // Default crop: shave off 5% margins from boundaries
        w = Math.round(image.width * 0.9);
        h = Math.round(image.height * 0.9);
      }

      x = Math.round((image.width - w) / 2);
      y = Math.round((image.height - h) / 2);

      logs.push(`[WORKER] Slicing image buffer at coordinates: offset-x=${x}, offset-y=${y}, width=${w}px, height=${h}px.`);
    }

    image.crop({ x, y, w, h });


    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    let mimeType = "image/jpeg";
    if (ext === ".png") mimeType = "image/png";
    else if (ext === ".webp") mimeType = "image/webp";

    const croppedBuffer = await image.getBuffer(mimeType as any);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_cropped${ext}`;
    const downloadUrl = `data:${mimeType};base64,${croppedBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] Crop successfully processed. Output file compiled.`);

    return {
      success: true,
      outputFileName,
      outputFileSize: croppedBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error cropping image:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Cropping failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to crop the image asset.",
    };
  }
};

const handleWebpConvert: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const quality = Number(settings.quality) || 75;

  const logs = [
    `[SYSTEM] Spawning WebP converter engine...`,
    `[WORKER] Loading image buffer: '${file.name}'`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] Input dimensions resolved: ${image.width}x${image.height}px.`);
    logs.push(`[WORKER] Compressing and encoding image layout to WebP standard format (Quality: ${quality}%)...`);

    const webpBuffer = await image.getBuffer("image/webp" as any, { quality });

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.webp`;
    const downloadUrl = `data:image/webp;base64,${webpBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] WebP conversion complete. Output file compiled.`);

    return {
      success: true,
      outputFileName,
      outputFileSize: webpBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting to WebP:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] WebP conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert image to WebP.",
    };
  }
};

const handlePngToJpg: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];

  const logs = [
    `[SYSTEM] Spawning PNG to JPG compiler engine...`,
    `[WORKER] Source image: '${file.name}'`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] PNG dimensions resolved: ${image.width}x${image.height}px.`);
    logs.push(`[WORKER] Flattening transparent channels on white canvas backdrop...`);

    // Create white background canvas
    const whiteBg = new Jimp({ width: image.width, height: image.height, color: 0xffffffff });
    whiteBg.composite(image, 0, 0);

    logs.push(`[WORKER] Compacting color layouts to JPEG standard...`);
    const jpgBuffer = await whiteBg.getBuffer("image/jpeg" as any);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
    const downloadUrl = `data:image/jpeg;base64,${jpgBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] Image converted to JPG successfully.`);

    return {
      success: true,
      outputFileName,
      outputFileSize: jpgBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting PNG to JPG:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert PNG to JPG format.",
    };
  }
};

const handleJpgToPng: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];

  const logs = [
    `[SYSTEM] Spawning JPG to PNG compiler engine...`,
    `[WORKER] Source image: '${file.name}'`,
  ];

  try {
    const { Jimp } = await import("jimp");
    const image = await Jimp.read(file.buffer);

    logs.push(`[WORKER] JPEG dimensions resolved: ${image.width}x${image.height}px.`);
    logs.push(`[WORKER] Re-allocating color channels to PNG lossless specifications...`);

    const pngBuffer = await image.getBuffer("image/png" as any);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.png`;
    const downloadUrl = `data:image/png;base64,${pngBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] Image converted to PNG successfully.`);

    return {
      success: true,
      outputFileName,
      outputFileSize: pngBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting JPG to PNG:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert JPEG to PNG format.",
    };
  }
};

export const imageServices: Record<string, ToolServiceFn> = {
  "image-compress": handleImageCompress,
  "bg-remover": handleBgRemover,
  "image-resize": handleImageResize,
  "image-crop": handleImageCrop,
  "webp-convert": handleWebpConvert,
  "png-to-jpg": handlePngToJpg,
  "jpg-to-png": handleJpgToPng,
};
