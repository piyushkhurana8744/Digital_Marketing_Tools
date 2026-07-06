import { pdfServices } from "./pdf";
import { imageServices } from "./image";

export interface ProcessResult {
  success: boolean;
  outputFileName?: string;
  outputFileSize?: number;
  downloadUrl?: string;
  logs: string[];
  error?: string;
}

export type ToolServiceFn = (
  userId: string,
  files: { name: string; size: number; buffer: Buffer }[],
  settings: Record<string, any>
) => Promise<ProcessResult>;

const serviceMap: Record<string, ToolServiceFn> = {
  ...pdfServices,
  ...imageServices,
};

/**
 * Main delegator to execute tool processing logic on the server.
 */
export async function executeToolService(
  slug: string,
  userId: string,
  files: { name: string; size: number; buffer: Buffer }[],
  settings: Record<string, any>
): Promise<ProcessResult> {
  const service = serviceMap[slug];
  
  if (!service) {
    return {
      success: false,
      logs: [
        `[SYSTEM] Error: Tool '${slug}' has no registered service backend handler.`,
      ],
      error: "Service not found",
    };
  }

  try {
    return await service(userId, files, settings);
  } catch (error: any) {
    console.error(`Error running tool service for ${slug}:`, error);
    return {
      success: false,
      logs: [
        `[SYSTEM] Exception: Internal error occurred in the execution engine.`,
        `[SYSTEM] Trace: ${error.message || error}`,
      ],
      error: error.message || "Execution failed",
    };
  }
}
