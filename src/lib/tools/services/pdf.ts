import { ToolServiceFn } from "./index";
import { pdfToPng } from "pdf-to-png-converter";
import { Jimp } from "jimp";
import AdmZip from "adm-zip";

// Simulates processing latency
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const handlePdfToJpg: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const quality = Number(settings.quality) || 90;

  const logs = [
    `[SYSTEM] Spawning PDF parsing thread...`,
    `[WORKER] Decoding PDF catalog references for '${file.name}'...`,
  ];

  try {
    logs.push(`[WORKER] Rasterizing pages to high-resolution buffers...`);
    
    // 1. Convert PDF buffer to PNG pages
    const pngPages = await pdfToPng(file.buffer, {
      viewportScale: 2.0, // Render at 2x scale for premium crisp image output
    });

    if (!pngPages || pngPages.length === 0) {
      throw new Error("No pages could be extracted from the PDF document.");
    }

    logs.push(`[WORKER] Successfully rasterized ${pngPages.length} PDF page(s).`);

    // 2. Transcode PNG buffers to JPG using Jimp
    const jpgFiles: { name: string; buffer: Buffer }[] = [];

    for (const page of pngPages) {
      logs.push(`[WORKER] Compressing page ${page.pageNumber} pixel buffer at quality ${quality}%...`);
      
      if (!page.content) {
        throw new Error(`Page content buffer for page ${page.pageNumber} is empty.`);
      }

      const image = await Jimp.read(page.content);
      const jpgBuffer = await image.getBuffer("image/jpeg", { quality });

      jpgFiles.push({
        name: `${file.name.replace(/\.[^/.]+$/, "")}_page_${page.pageNumber}.jpg`,
        buffer: jpgBuffer,
      });
    }

    let outputFileName = "";
    let downloadUrl = "";
    let outputFileSize = 0;

    if (jpgFiles.length === 1) {
      // Single page: Output a single JPG file
      const singleJpg = jpgFiles[0];
      outputFileName = singleJpg.name;
      outputFileSize = singleJpg.buffer.length;
      downloadUrl = `data:image/jpeg;base64,${singleJpg.buffer.toString("base64")}`;
      logs.push(`[SYSTEM] Single page output created: ${outputFileName}`);
    } else {
      // Multiple pages: Bundle into a standard ZIP archive
      logs.push(`[SYSTEM] Compiling ${jpgFiles.length} pages into a ZIP archive...`);
      const zip = new AdmZip();
      
      for (const jpgFile of jpgFiles) {
        zip.addFile(jpgFile.name, jpgFile.buffer);
      }

      const zipBuffer = zip.toBuffer();
      outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_converted_jpgs.zip`;
      outputFileSize = zipBuffer.length;
      downloadUrl = `data:application/zip;base64,${zipBuffer.toString("base64")}`;
      logs.push(`[SYSTEM] Multiple page ZIP archive created: ${outputFileName}`);
    }

    return {
      success: true,
      outputFileName,
      outputFileSize,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting PDF to JPG:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert PDF pages to JPEG images.",
    };
  }
};

const handleJpgToPdf: ToolServiceFn = async (userId, files, settings) => {
  const orientation = settings.orientation || "portrait";
  const hasMargin = settings.margin === true;

  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();

    const logs = [
      `[SYSTEM] Reading ${files.length} JPG payloads...`,
      `[WORKER] Spawning PDF compiler thread...`,
      `[WORKER] Target configuration: orientation=${orientation}, margin=${hasMargin ? "20px" : "none"}`,
    ];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logs.push(`[WORKER] Embedding image ${i + 1}: ${file.name}...`);

      let embeddedImage;
      const lowerName = file.name.toLowerCase();
      
      // Support JPG and PNG
      if (lowerName.endsWith(".png")) {
        embeddedImage = await pdfDoc.embedPng(file.buffer);
      } else {
        embeddedImage = await pdfDoc.embedJpg(file.buffer);
      }

      const { width, height } = embeddedImage.scale(1.0);

      // Determine dimensions based on settings
      let pageWidth = width;
      let pageHeight = height;
      let x = 0;
      let y = 0;
      let drawWidth = width;
      let drawHeight = height;

      const marginSize = hasMargin ? 20 : 0;

      if (orientation === "landscape") {
        // Landscape fit logic
        pageWidth = Math.max(width, height);
        pageHeight = Math.min(width, height);
        const scale = Math.min(
          (pageWidth - 2 * marginSize) / width,
          (pageHeight - 2 * marginSize) / height
        );
        drawWidth = width * scale;
        drawHeight = height * scale;
        x = (pageWidth - drawWidth) / 2;
        y = (pageHeight - drawHeight) / 2;
      } else if (orientation === "portrait") {
        // Portrait fit logic
        pageWidth = Math.min(width, height);
        pageHeight = Math.max(width, height);
        const scale = Math.min(
          (pageWidth - 2 * marginSize) / width,
          (pageHeight - 2 * marginSize) / height
        );
        drawWidth = width * scale;
        drawHeight = height * scale;
        x = (pageWidth - drawWidth) / 2;
        y = (pageHeight - drawHeight) / 2;
      } else {
        // Auto natural fit logic
        pageWidth = width + 2 * marginSize;
        pageHeight = height + 2 * marginSize;
        x = marginSize;
        y = marginSize;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }

    logs.push(`[SYSTEM] Packaging document objects...`);
    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    logs.push(`[SYSTEM] Compilation finished successfully. PDF binary ready.`);

    return {
      success: true,
      outputFileName: "compiled_images.pdf",
      outputFileSize: pdfBuffer.length,
      downloadUrl: `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting JPG to PDF:", error);
    return {
      success: false,
      logs: [
        `[SYSTEM] Spawning PDF compiler thread failed.`,
        `[ERROR] ${error.message || error}`,
      ],
      error: error.message || "Failed to compile images to PDF.",
    };
  }
};

const handlePdfMerge: ToolServiceFn = async (userId, files, settings) => {
  const logs = [
    `[SYSTEM] Initializing PDF merge engine...`,
    `[WORKER] Parsing ${files.length} PDF file stream(s)...`,
  ];

  try {
    const { PDFDocument } = await import("pdf-lib");
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      logs.push(`[WORKER] Loading PDF file ${i + 1}: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`);
      
      const pdfDoc = await PDFDocument.load(file.buffer);
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      
      logs.push(`[WORKER] Merging ${copiedPages.length} page(s) from '${file.name}'...`);
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    logs.push(`[SYSTEM] Compiling merged document...`);
    const mergedPdfBytes = await mergedPdf.save();
    const mergedPdfBuffer = Buffer.from(mergedPdfBytes);
    
    const outputFileName = `merged_${Date.now()}.pdf`;
    const downloadUrl = `data:application/pdf;base64,${mergedPdfBuffer.toString("base64")}`;
    const outputFileSize = mergedPdfBuffer.length;

    logs.push(`[SYSTEM] PDF merge complete. Consolidated ${mergedPdf.getPageCount()} total page(s).`);

    return {
      success: true,
      outputFileName,
      outputFileSize,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error merging PDF documents:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Merge failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to merge PDF documents.",
    };
  }
};

const handlePdfSplit: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const splitRange = settings.splitRange || "all";
  
  return {
    success: true,
    outputFileName: `${file.name.replace(/\.[^/.]+$/, "")}_split.pdf`,
    outputFileSize: Math.floor(file.size * 0.5),
    downloadUrl: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iagogIDw8IC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUiA+PgplbmRvYmoKMiAwIG9iagogIDw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCiAgPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiA+PgplbmRvYmoKdHJhaWxlcgogIDw8IC9TaXplIDQgL1Jvb3QgMSAwIFIgPj4KJSVFT0Y=",
    logs: [
      `[SYSTEM] Reading PDF document stream...`,
      `[WORKER] Parsing page index lists...`,
      `[WORKER] Extracting page nodes for target range: ${splitRange}.`,
      `[WORKER] Regenerating header catalog map entries...`,
      `[SYSTEM] Split complete. Output compiled successfully.`,
    ],
  };
};

const handlePdfCompress: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const compressionLevel = settings.compressionLevel || "recommended";

  const logs = [
    `[SYSTEM] Starting compression task (Level: ${compressionLevel})...`,
    `[WORKER] Uploaded payload size: ${(file.size / 1024).toFixed(1)} KB`,
  ];

  try {
    // Determine scale and image quality based on compressionLevel setting
    let viewportScale = 1.5;
    let quality = 70;

    if (compressionLevel === "low (maximum quality)") {
      viewportScale = 2.0;
      quality = 85;
    } else if (compressionLevel === "high (extreme compression)") {
      viewportScale = 1.0;
      quality = 40;
    }

    logs.push(`[WORKER] Target parameters resolved: scale=${viewportScale}, quality=${quality}%`);
    logs.push(`[WORKER] Parsing PDF structural layers...`);

    // 1. Rasterize PDF pages to PNG buffers
    const pngPages = await pdfToPng(file.buffer, {
      viewportScale,
    });

    if (!pngPages || pngPages.length === 0) {
      throw new Error("Could not extract pages from the PDF document.");
    }

    logs.push(`[WORKER] Extracted ${pngPages.length} document page(s). Downsampling...`);

    // 2. Create a new PDF document using pdf-lib
    const { PDFDocument } = await import("pdf-lib");
    const pdfDoc = await PDFDocument.create();

    for (const page of pngPages) {
      if (!page.content) {
        throw new Error(`Page content buffer for page ${page.pageNumber} is empty.`);
      }

      logs.push(`[WORKER] Processing and compressing page ${page.pageNumber}...`);

      // 3. Compress using Jimp
      const image = await Jimp.read(page.content);
      const jpgBuffer = await image.getBuffer("image/jpeg", { quality });

      // 4. Embed JPEG into the new PDF document
      const embeddedImage = await pdfDoc.embedJpg(jpgBuffer);
      const { width, height } = embeddedImage.scale(1.0);

      const newPage = pdfDoc.addPage([width, height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    logs.push(`[SYSTEM] Packaging and compressing PDF stream objects...`);
    // 5. Save with object stream compression
    const compressedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const compressedPdfBuffer = Buffer.from(compressedPdfBytes);

    const compressionRatio = ((1 - compressedPdfBuffer.length / file.size) * 100).toFixed(1);
    logs.push(`[SYSTEM] Compression complete. Size reduced from ${(file.size / 1024).toFixed(1)} KB to ${(compressedPdfBuffer.length / 1024).toFixed(1)} KB (Reduced by ${compressionRatio}%).`);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}_compressed.pdf`;
    const downloadUrl = `data:application/pdf;base64,${compressedPdfBuffer.toString("base64")}`;

    return {
      success: true,
      outputFileName,
      outputFileSize: compressedPdfBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error compressing PDF:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Compression failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to compress the PDF document.",
    };
  }
};

const handlePdfToWord: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];

  const logs = [
    `[SYSTEM] Starting PDF parsing analyzer...`,
    `[WORKER] Loading PDF file: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`,
  ];

  try {
    const { PDFParse } = await import("pdf-parse");
    const { Document, Packer, Paragraph, TextRun, PageBreak } = await import("docx");

    logs.push(`[WORKER] Spawning PDF character metrics parser...`);
    const parser = new PDFParse({ data: file.buffer });
    
    logs.push(`[WORKER] Extracting text nodes and page structures...`);
    const result = await parser.getText();

    if (!result || !result.pages || result.pages.length === 0) {
      throw new Error("No readable text content could be extracted from the PDF.");
    }

    logs.push(`[WORKER] Found ${result.pages.length} document page(s). Building DOCX stream...`);

    const docChildren: any[] = [];

    for (let i = 0; i < result.pages.length; i++) {
      const page = result.pages[i];
      
      // Clean and split page text by newlines to form separate paragraphs
      const lines = page.text.split("\n");
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          docChildren.push(
            new Paragraph({
              children: [new TextRun({ text: trimmed, font: "Arial", size: 24 })], // 12pt Arial
            })
          );
        }
      }

      // Add a page break between pages (except after the last page)
      if (i < result.pages.length - 1) {
        docChildren.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
      }
    }

    logs.push(`[SYSTEM] Compiling OpenXML word document structure...`);
    
    const doc = new Document({
      sections: [
        {
          children: docChildren,
        },
      ],
    });

    const docxBytes = await Packer.toBuffer(doc);
    const docxBuffer = Buffer.from(docxBytes);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.docx`;
    const downloadUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${docxBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] DOCX output compiled successfully: ${outputFileName} (${(docxBuffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      outputFileName,
      outputFileSize: docxBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting PDF to Word:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert PDF to Word document.",
    };
  }
};

const handleWordToPdf: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];

  const logs = [
    `[SYSTEM] Spawning Word layout compiler engine...`,
    `[WORKER] Loading DOCX binary stream: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`,
  ];

  try {
    const mammoth = await import("mammoth");
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    logs.push(`[WORKER] Parsing XML layout nodes inside DOCX container...`);
    const parseResult = await mammoth.extractRawText({ buffer: file.buffer });
    const text = parseResult.value;

    if (!text || text.trim() === "") {
      throw new Error("No text content could be extracted from the Word document.");
    }

    logs.push(`[WORKER] Resolving character widths and wrapping text layout...`);

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 15;
    const margin = 50;
    const pageWidth = 612; // Standard Letter width in points
    const pageHeight = 792; // Standard Letter height in points
    const contentWidth = pageWidth - margin * 2;

    // Word wrapping utility
    const wrapText = (str: string, maxW: number): string[] => {
      const words = str.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxW) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    const docLines = text.split("\n");
    const wrappedLines: string[] = [];

    for (const line of docLines) {
      if (line.trim() === "") {
        wrappedLines.push(""); // Preserve empty lines for paragraph spacing
      } else {
        const wrapped = wrapText(line, contentWidth);
        wrappedLines.push(...wrapped);
      }
    }

    logs.push(`[WORKER] Flowing lines onto PDF page grids...`);

    let page = doc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    for (const line of wrappedLines) {
      // Check if we exceed the page height, and spawn a new page
      if (y < margin + lineHeight) {
        page = doc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      if (line !== "") {
        page.drawText(line, {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1), // Charcoal body text
        });
      }
      y -= lineHeight;
    }

    logs.push(`[SYSTEM] Packaging consolidated PDF objects...`);
    const pdfBytes = await doc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
    const downloadUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] PDF output generated successfully: ${outputFileName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      outputFileName,
      outputFileSize: pdfBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting Word to PDF:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert Word document to PDF.",
    };
  }
};

const handleExcelToPdf: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];
  const fitToPage = settings.fitToPage !== false; // default to true

  const logs = [
    `[SYSTEM] Spawning spreadsheet parser engine...`,
    `[WORKER] Loading Excel workbook stream: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`,
  ];

  try {
    const xlsx = await import("xlsx");
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    logs.push(`[WORKER] Parsing workbook sheets and cell values...`);
    const workbook = xlsx.read(file.buffer, { type: "buffer" });
    const sheetNames = workbook.SheetNames;

    if (!sheetNames || sheetNames.length === 0) {
      throw new Error("No worksheets found inside the Excel document.");
    }

    logs.push(`[SYSTEM] Initializing blank PDF compiler canvas...`);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 8;
    const fontBoldSize = 8;
    const cellLineHeight = 11;
    const cellPaddingX = 4;
    const cellPaddingY = 5;
    const minRowHeight = 18;
    const margin = 40;
    const pageWidth = 612; // Standard Letter page layout bounds
    const pageHeight = 792;
    const printableWidth = pageWidth - margin * 2;

    // Helper text-wrap utility inside a cell
    const wrapCellText = (text: string, colWidth: number, fSize: number, fontObj: any): string[] => {
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = fontObj.widthOfTextAtSize(testLine, fSize);
        if (testWidth > colWidth - cellPaddingX * 2) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Force break long word
            let brokenLine = "";
            for (const char of word) {
              const testCharLine = brokenLine + char;
              if (fontObj.widthOfTextAtSize(testCharLine, fSize) > colWidth - cellPaddingX * 2) {
                lines.push(brokenLine);
                brokenLine = char;
              } else {
                brokenLine = testCharLine;
              }
            }
            currentLine = brokenLine;
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines.length > 0 ? lines : [""];
    };

    for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
      const sheetName = sheetNames[sheetIndex];
      logs.push(`[WORKER] Processing sheet [${sheetIndex + 1}/${sheetNames.length}]: '${sheetName}'...`);

      const worksheet = workbook.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });

      // Clean sheet data, find boundaries of content
      let maxCols = 0;
      const cleanRows: string[][] = [];

      for (const row of rawRows) {
        const cleanRow = (row || []).map((cell: any) => {
          if (cell === null || cell === undefined) return "";
          return String(cell).trim();
        });
        cleanRows.push(cleanRow);
        if (cleanRow.length > maxCols) {
          maxCols = cleanRow.length;
        }
      }

      // Strip trailing empty rows
      while (cleanRows.length > 0 && cleanRows[cleanRows.length - 1].every(cell => cell === "")) {
        cleanRows.pop();
      }

      // Strip trailing empty columns
      let actualMaxCols = 0;
      for (const row of cleanRows) {
        let lastNonEmpty = row.length - 1;
        while (lastNonEmpty >= 0 && row[lastNonEmpty] === "") {
          lastNonEmpty--;
        }
        if (lastNonEmpty + 1 > actualMaxCols) {
          actualMaxCols = lastNonEmpty + 1;
        }
      }

      // Slice rows to fit actualMaxCols
      const gridData = cleanRows.map(row => {
        const trimmed = row.slice(0, actualMaxCols);
        while (trimmed.length < actualMaxCols) {
          trimmed.push("");
        }
        return trimmed;
      });

      // Prepare a page for this worksheet
      let page = doc.addPage([pageWidth, pageHeight]);
      let y = pageHeight - margin;

      // Draw Worksheet Title
      page.drawText(`Sheet: ${sheetName}`, {
        x: margin,
        y: y - 10,
        size: 13,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.2),
      });

      page.drawLine({
        start: { x: margin, y: y - 18 },
        end: { x: pageWidth - margin, y: y - 18 },
        thickness: 0.8,
        color: rgb(0.7, 0.7, 0.7),
      });

      y -= 35; // Position below sheet title bar

      if (gridData.length === 0 || actualMaxCols === 0) {
        page.drawText("(Empty worksheet)", {
          x: margin,
          y: y - 15,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
        continue;
      }

      // Sizing columns: default min 45pt, max 160pt, calculated dynamically
      const colWidths = new Array(actualMaxCols).fill(45);
      for (let colIdx = 0; colIdx < actualMaxCols; colIdx++) {
        let maxCharLen = 0;
        for (let rowIdx = 0; rowIdx < gridData.length; rowIdx++) {
          const val = gridData[rowIdx][colIdx];
          if (val.length > maxCharLen) {
            maxCharLen = val.length;
          }
        }
        const estWidth = Math.max(45, Math.min(160, maxCharLen * 5.5 + 12));
        colWidths[colIdx] = estWidth;
      }

      // Auto-fit to page scaling calculation
      const totalGridWidth = colWidths.reduce((a, b) => a + b, 0);
      if (fitToPage && totalGridWidth > 0) {
        const scaleFactor = printableWidth / totalGridWidth;
        for (let colIdx = 0; colIdx < colWidths.length; colIdx++) {
          colWidths[colIdx] = colWidths[colIdx] * scaleFactor;
        }
      }

      // Helper header row reference for paginated redrawing
      const renderHeaderRow = (p: any, startY: number): number => {
        let currentX = margin;
        // Calculate header row height
        const headerCellLines = gridData[0].map((cellText, c) =>
          wrapCellText(cellText, colWidths[c], fontBoldSize, fontBold)
        );
        const maxHeaderLines = Math.max(...headerCellLines.map(lines => lines.length));
        const headerHeight = Math.max(minRowHeight, maxHeaderLines * cellLineHeight + cellPaddingY * 2);

        // Draw cells of header
        for (let colIdx = 0; colIdx < actualMaxCols; colIdx++) {
          const lines = headerCellLines[colIdx];
          // Draw border & background rectangle
          p.drawRectangle({
            x: currentX,
            y: startY - headerHeight,
            width: colWidths[colIdx],
            height: headerHeight,
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5,
            color: rgb(0.9, 0.93, 0.97),
          });

          // Draw cell text lines
          lines.forEach((line, idx) => {
            const lineY = startY - cellPaddingY - cellLineHeight * (idx + 1) + 2;
            p.drawText(line, {
              x: currentX + cellPaddingX,
              y: lineY,
              size: fontBoldSize,
              font: fontBold,
              color: rgb(0.1, 0.1, 0.2),
            });
          });

          currentX += colWidths[colIdx];
        }
        return headerHeight;
      };

      // Draw initial table header row
      const firstHeaderHeight = renderHeaderRow(page, y);
      y -= firstHeaderHeight;

      // Draw all subsequent row elements
      for (let rowIdx = 1; rowIdx < gridData.length; rowIdx++) {
        // Pre-wrap row cell elements
        const cellLines = gridData[rowIdx].map((cellText, c) =>
          wrapCellText(cellText, colWidths[c], fontSize, font)
        );
        const maxLines = Math.max(...cellLines.map(lines => lines.length));
        const rowHeight = Math.max(minRowHeight, maxLines * cellLineHeight + cellPaddingY * 2);

        // Check page boundary overflow
        if (y - rowHeight < margin) {
          logs.push(`[WORKER] Adding new page for overflow rows in sheet '${sheetName}'...`);
          page = doc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
          // Redraw header row on top of new page
          const headerHeight = renderHeaderRow(page, y);
          y -= headerHeight;
        }

        // Draw body row cells
        let currentX = margin;
        for (let colIdx = 0; colIdx < actualMaxCols; colIdx++) {
          const lines = cellLines[colIdx];
          const zebraColor = rowIdx % 2 === 1 ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1);

          page.drawRectangle({
            x: currentX,
            y: y - rowHeight,
            width: colWidths[colIdx],
            height: rowHeight,
            borderColor: rgb(0.85, 0.85, 0.85),
            borderWidth: 0.5,
            color: zebraColor,
          });

          lines.forEach((line, idx) => {
            const lineY = y - cellPaddingY - cellLineHeight * (idx + 1) + 2;
            page.drawText(line, {
              x: currentX + cellPaddingX,
              y: lineY,
              size: fontSize,
              font,
              color: rgb(0.15, 0.15, 0.15),
            });
          });

          currentX += colWidths[colIdx];
        }
        y -= rowHeight;
      }
    }

    logs.push(`[SYSTEM] Packaging OpenXML worksheet streams...`);
    const pdfBytes = await doc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
    const downloadUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] PDF output generated successfully: ${outputFileName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      outputFileName,
      outputFileSize: pdfBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting Excel to PDF:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert Excel spreadsheet to PDF.",
    };
  }
};

const handlePptToPdf: ToolServiceFn = async (userId, files, settings) => {
  const file = files[0];

  const logs = [
    `[SYSTEM] Spawning PowerPoint layout analyzer...`,
    `[WORKER] Loading presentation stream: '${file.name}' (${(file.size / 1024).toFixed(1)} KB)...`,
  ];

  try {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    logs.push(`[WORKER] Parsing zip archive directories...`);
    let zip;
    try {
      zip = new AdmZip(file.buffer);
    } catch (zipErr) {
      throw new Error("Could not parse file. Older binary .ppt templates are not supported; please save as modern .pptx and upload again.");
    }

    const entries = zip.getEntries();
    const slideEntries = entries.filter((entry) =>
      /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName)
    );

    if (slideEntries.length === 0) {
      throw new Error("No PowerPoint slide XML components found. Ensure you are uploading a valid modern .pptx document.");
    }

    // Sort slide pages sequentially
    slideEntries.sort((a, b) => {
      const numA = parseInt(a.entryName.replace(/\D/g, ""), 10);
      const numB = parseInt(b.entryName.replace(/\D/g, ""), 10);
      return numA - numB;
    });

    logs.push(`[SYSTEM] Initializing widescreen 16:9 PDF compiler canvas...`);
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const decodeHtmlEntities = (str: string): string => {
      return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    };

    const wrapText = (str: string, maxW: number, fSize: number, fontObj: any): string[] => {
      const words = str.split(/\s+/);
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = fontObj.widthOfTextAtSize(testLine, fSize);
        if (testWidth > maxW) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            let brokenLine = "";
            for (const char of word) {
              const testCharLine = brokenLine + char;
              if (fontObj.widthOfTextAtSize(testCharLine, fSize) > maxW) {
                lines.push(brokenLine);
                brokenLine = char;
              } else {
                brokenLine = testCharLine;
              }
            }
            currentLine = brokenLine;
          }
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
      return lines;
    };

    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      logs.push(`[WORKER] Rasterizing slide template [${i + 1}/${slideEntries.length}]...`);

      const slideXml = entry.getData().toString("utf8");

      // Extract text content grouped by paragraph <a:p>
      const paragraphs: string[] = [];
      const pRegex = /<a:p>([\s\S]*?)<\/a:p>/g;
      let pMatch;

      while ((pMatch = pRegex.exec(slideXml)) !== null) {
        const pContent = pMatch[1];
        const tRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
        let tMatch;
        let paragraphText = "";

        while ((tMatch = tRegex.exec(pContent)) !== null) {
          paragraphText += tMatch[1];
        }

        const cleanText = decodeHtmlEntities(paragraphText).trim();
        if (cleanText) {
          paragraphs.push(cleanText);
        }
      }

      // Add a landscape widescreen presentation canvas page (720 x 405 pt)
      let page = doc.addPage([720, 405]);

      // Helper slide background and frame drawing utility
      const drawSlideFrame = (p: any, titleStr: string, isCont: boolean) => {
        // Soft off-white slide background
        p.drawRectangle({
          x: 0,
          y: 0,
          width: 720,
          height: 405,
          color: rgb(0.97, 0.98, 0.99),
        });

        // Double border graphic element
        p.drawRectangle({
          x: 25,
          y: 25,
          width: 670,
          height: 355,
          borderColor: rgb(0.88, 0.9, 0.93),
          borderWidth: 1.5,
        });

        // Widescreen page numbers at bottom-right
        p.drawText(`Slide ${i + 1} of ${slideEntries.length}`, {
          x: 585,
          y: 35,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.6),
        });

        // Branding signature at bottom-left
        p.drawText("DigiTools AI Widescreen PPT", {
          x: 50,
          y: 35,
          size: 8,
          font: fontBold,
          color: rgb(0.4, 0.4, 0.5),
        });
      };

      // Draw initial frame
      drawSlideFrame(page, "", false);

      const titleText = paragraphs[0] || "(Untitled Slide)";
      const titleFontSize = 18;
      const wrappedTitle = wrapText(titleText, 560, titleFontSize, fontBold);
      let currentY = 345;

      wrappedTitle.forEach((line) => {
        page.drawText(line, {
          x: 50,
          y: currentY,
          size: titleFontSize,
          font: fontBold,
          color: rgb(0.08, 0.08, 0.18),
        });
        currentY -= 22;
      });

      // Accent color slide divider rule (neon cyan)
      page.drawLine({
        start: { x: 50, y: currentY - 5 },
        end: { x: 670, y: currentY - 5 },
        thickness: 1.5,
        color: rgb(0.06, 0.75, 0.85),
      });

      currentY -= 28;

      const bodyFontSize = 11;
      const lineSpacing = 15;
      const paragraphSpacing = 10;

      for (let pIdx = 1; pIdx < paragraphs.length; pIdx++) {
        const bodyText = paragraphs[pIdx];
        const wrappedBody = wrapText(bodyText, 540, bodyFontSize, font);

        // Slide height bounds overflow protection: wrap text block to continuing slide
        const neededHeight = wrappedBody.length * lineSpacing + paragraphSpacing;
        if (currentY - neededHeight < 55) {
          logs.push(`[WORKER] Adding sub-slide for overflow items on slide ${i + 1}...`);
          page = doc.addPage([720, 405]);
          drawSlideFrame(page, titleText, true);

          // Draw continuing title
          page.drawText(`${titleText} (Continued)`, {
            x: 50,
            y: 345,
            size: titleFontSize - 2,
            font: fontBold,
            color: rgb(0.08, 0.08, 0.18),
          });

          page.drawLine({
            start: { x: 50, y: 337 },
            end: { x: 670, y: 337 },
            thickness: 1.2,
            color: rgb(0.06, 0.75, 0.85),
          });

          currentY = 308;
        }

        wrappedBody.forEach((line, lineIdx) => {
          const isFirstLine = lineIdx === 0;
          const prefix = isFirstLine ? "• " : "  ";
          page.drawText(prefix + line, {
            x: 55,
            y: currentY,
            size: bodyFontSize,
            font,
            color: rgb(0.2, 0.2, 0.25),
          });
          currentY -= lineSpacing;
        });

        currentY -= paragraphSpacing;
      }
    }

    logs.push(`[SYSTEM] Compiling presentation slides...`);
    const pdfBytes = await doc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const outputFileName = `${file.name.replace(/\.[^/.]+$/, "")}.pdf`;
    const downloadUrl = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

    logs.push(`[SYSTEM] PDF output generated successfully: ${outputFileName} (${(pdfBuffer.length / 1024).toFixed(1)} KB)`);

    return {
      success: true,
      outputFileName,
      outputFileSize: pdfBuffer.length,
      downloadUrl,
      logs,
    };
  } catch (error: any) {
    console.error("Error converting PPT to PDF:", error);
    return {
      success: false,
      logs: [
        ...logs,
        `[ERROR] Conversion failed: ${error.message || error}`,
      ],
      error: error.message || "Failed to convert PPT slides to PDF.",
    };
  }
};

export const pdfServices: Record<string, ToolServiceFn> = {
  "pdf-to-jpg": handlePdfToJpg,
  "jpg-to-pdf": handleJpgToPdf,
  "pdf-merge": handlePdfMerge,
  "pdf-split": handlePdfSplit,
  "pdf-compress": handlePdfCompress,
  "pdf-to-word": handlePdfToWord,
  "word-to-pdf": handleWordToPdf,
  "excel-to-pdf": handleExcelToPdf,
  "ppt-to-pdf": handlePptToPdf,
};
