import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth/dal";
import { rateLimit } from "@/lib/auth/rate-limit";
import { getToolBySlug } from "@/lib/tools/registry";
import { executeToolService } from "@/lib/tools/services";
import ConversionLog from "@/lib/models/ConversionLog";
import AnonymousUsage from "@/lib/models/AnonymousUsage";
import SavedFile from "@/lib/models/SavedFile";
import User from "@/lib/models/User";
import { connectToDatabase } from "@/lib/db";

export async function POST(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const { slug } = params;
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";

  // 1. Resolve identification
  const session = await getSession();
  const cookieStore = await cookies();
  const visitorId = cookieStore.get("visitor_id")?.value || request.headers.get("x-visitor-id") || undefined;

  // 2. Validate tool exists
  const tool = getToolBySlug(slug);
  if (!tool) {
    return NextResponse.json({ error: "Requested tool does not exist." }, { status: 404 });
  }

  // 3. Rate limiting (20 requests per minute per IP)
  const rl = await rateLimit(ip, { limit: 20, windowMs: 60 * 1000 }, `tool:${slug}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a minute before running this tool again." },
      { status: 429 }
    );
  }

  await connectToDatabase();

  // 4. Verify usage boundaries (Logged In vs Anonymous)
  if (!session) {
    // Anonymous checkout limits
    if (!visitorId) {
      return NextResponse.json({ error: "Visitor identification (visitorId) required." }, { status: 400 });
    }

    const usage = await AnonymousUsage.findOne({ visitorId });
    if (usage && usage.count >= 3) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: "You have reached the free tier limit of 3 conversions. Please log in or register.",
        },
        { status: 403 }
      );
    }
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    
    const settingsRaw = formData.get("settings") as string | null;
    const settings = settingsRaw ? JSON.parse(settingsRaw) : {};

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    // 5. File constraints validations
    for (const file of files) {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!tool.acceptedFileTypes.some(t => t.toLowerCase() === ext || t === "*")) {
        return NextResponse.json(
          { error: `File type '${ext}' not allowed. Allowed types: ${tool.acceptedFileTypes.join(", ")}` },
          { status: 400 }
        );
      }

      if (file.size > tool.maxFileSizeBytes) {
        const mbLimit = (tool.maxFileSizeBytes / (1024 * 1024)).toFixed(0);
        return NextResponse.json(
          { error: `File '${file.name}' exceeds the maximum allowed size of ${mbLimit}MB.` },
          { status: 400 }
        );
      }
    }

    // 6. Check and deduct credits for Logged In users
    if (session) {
      const user = await User.findById(session.userId);
      if (!user) {
        return NextResponse.json({ error: "User profile not found." }, { status: 404 });
      }

      const userCredits = (user as any).credits !== undefined ? (user as any).credits : 5000;
      if (userCredits < tool.creditsCost) {
        return NextResponse.json(
          { error: `Insufficient credits. Costs ${tool.creditsCost} credits, you have ${userCredits}.` },
          { status: 403 }
        );
      }

      if ((user as any).credits !== undefined) {
        (user as any).credits -= tool.creditsCost;
        await user.save();
      }
    }

    // 7. Parse file buffers
    const processedFiles = [];
    for (const file of files) {
      const arrayBuf = await file.arrayBuffer();
      processedFiles.push({
        name: file.name,
        size: file.size,
        buffer: Buffer.from(arrayBuf),
      });
    }

    // 8. Run processing service
    const targetUserId = session ? session.userId : "anonymous";
    const result = await executeToolService(slug, targetUserId, processedFiles, settings);

    // 9. Write logs
    await ConversionLog.create({
      userId: session ? new mongoose.Types.ObjectId(session.userId) : undefined,
      visitorId: session ? undefined : visitorId,
      toolSlug: slug,
      status: result.success ? "completed" : "failed",
      inputFileName: files[0].name,
      inputFileSize: files[0].size,
      outputFileName: result.outputFileName,
      outputFileSize: result.outputFileSize,
      creditsUsed: tool.creditsCost,
      errorDetails: result.error,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "File processing failed.", logs: result.logs }, { status: 500 });
    }

    // 10. Logged In: Save generated files / Anonymous: Increment counts
    if (session) {
      await SavedFile.create({
        userId: new mongoose.Types.ObjectId(session.userId),
        toolSlug: slug,
        fileName: result.outputFileName,
        fileSize: result.outputFileSize,
        downloadUrl: result.downloadUrl,
      });
    } else {
      // Increment anonymous usage count
      await AnonymousUsage.findOneAndUpdate(
        { visitorId },
        {
          $inc: { count: 1 },
          $addToSet: { ips: ip },
          $setOnInsert: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        { upsert: true }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API error executing tool:", error);
    return NextResponse.json({ error: error.message || "Internal server error." }, { status: 500 });
  }
}
