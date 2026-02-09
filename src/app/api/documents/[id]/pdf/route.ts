import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { promises as fs } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "quote"; // Default to quote if not specified
    const url = searchParams.get("url"); // Optional: if URL is provided directly
    const uploadUrl = searchParams.get("uploadUrl"); // Optional: Convex upload URL

    const remoteExecutablePath =
      "https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar";

    // Validate type
    if (type !== "quote" && type !== "invoice") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'quote' or 'invoice'" },
        { status: 400 }
      );
    }

    // Construct the URL to the doc-preview page
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://sleads.nl`
        : "http://localhost:3000";

    const previewUrl = url || `${baseUrl}/doc-preview/${type}/${id}`;

    console.log(`Generating PDF for: ${previewUrl}`);

    // Determine if we're on Vercel/production or local development
    const isVercel = !!process.env.VERCEL;
    const isProduction = process.env.NODE_ENV === "production";

    let browser;

    if (isVercel || (isProduction && process.platform === "linux")) {
      // Use @sparticuz/chromium on Vercel or Linux production
      console.log("Using @sparticuz/chromium for serverless environment");

      try {
        const executablePath =
          await chromium.executablePath(remoteExecutablePath);
        console.log(`Chromium executable path: ${executablePath}`);

        browser = await puppeteer.launch({
          args: [
            ...chromium.args,
            "--hide-scrollbars",
            "--disable-web-security",
            "--disable-gpu",
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
          defaultViewport: { width: 1920, height: 1080 },
          executablePath,
          headless: true,
        });
      } catch (chromiumError) {
        console.error("Error setting up Chromium:", chromiumError);
        throw new Error(
          `Failed to initialize Chromium: ${
            chromiumError instanceof Error
              ? chromiumError.message
              : "Unknown error"
          }. Make sure @sparticuz/chromium is properly installed and configured.`
        );
      }
    } else {
      // Local development: Use system Chrome
      console.log(
        `Local development detected (${process.platform}), using system Chrome`
      );

      let executablePath: string | undefined;

      // Find Chrome at standard locations based on platform
      if (process.platform === "darwin") {
        // macOS
        executablePath =
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      } else if (process.platform === "linux") {
        // Linux - try common locations
        const possiblePaths = [
          "/usr/bin/google-chrome-stable",
          "/usr/bin/google-chrome",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
        ];

        // Check which one exists
        for (const possiblePath of possiblePaths) {
          try {
            await fs.access(possiblePath);
            executablePath = possiblePath;
            break;
          } catch {
            // Continue to next path
          }
        }
      } else if (process.platform === "win32") {
        // Windows
        executablePath =
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
      }

      if (!executablePath) {
        throw new Error(
          `Chrome not found. Please install Google Chrome. For ${process.platform}, expected locations:\n` +
            (process.platform === "darwin"
              ? "- /Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
              : process.platform === "linux"
                ? "- /usr/bin/google-chrome-stable\n- /usr/bin/google-chrome\n- /usr/bin/chromium-browser"
                : "- C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
        );
      }

      browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: { width: 1920, height: 1080 },
        executablePath,
        headless: true,
      });
    }

    try {
      const page = await browser.newPage();

      // Navigate to the page
      await page.goto(previewUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait a bit more for any dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0mm",
          right: "0mm",
          bottom: "0mm",
          left: "0mm",
        },
      });

      // Generate filename
      const filename = `${type}-${id}-${Date.now()}.pdf`;
      let filepath: string | undefined;
      let storageId: string | undefined;

      // Only save locally in development (not on Vercel where filesystem is read-only)
      if (!isVercel) {
        try {
          // Create pdfs directory if it doesn't exist
          const pdfsDir = path.join(process.cwd(), "pdfs");
          try {
            await fs.access(pdfsDir);
          } catch {
            await fs.mkdir(pdfsDir, { recursive: true });
          }

          filepath = path.join(pdfsDir, filename);
          // Save PDF to file
          await fs.writeFile(filepath, pdfBuffer);
          console.log(`PDF saved to: ${filepath}`);
        } catch (fileError) {
          console.warn("Failed to save PDF locally:", fileError);
          // Continue even if local save fails
        }
      }

      // Upload to Convex storage if uploadUrl is provided
      if (uploadUrl) {
        try {
          console.log("Uploading PDF to Convex storage...");
          // Upload PDF buffer to Convex storage
          const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/pdf" },
            body: pdfBuffer as unknown as BodyInit,
          });

          if (!uploadResult.ok) {
            throw new Error(`Upload failed: ${uploadResult.statusText}`);
          }

          const uploadResponse = await uploadResult.json();
          storageId = uploadResponse.storageId;
          console.log(`PDF uploaded to Convex storage: ${storageId}`);
        } catch (uploadError) {
          console.error("Error uploading PDF to Convex:", uploadError);
          throw new Error(
            `PDF generated but upload failed: ${
              uploadError instanceof Error
                ? uploadError.message
                : "Unknown error"
            }`
          );
        }
      } else if (isVercel) {
        // On Vercel, uploadUrl is required since we can't save locally
        throw new Error(
          "uploadUrl is required on Vercel. Cannot save files to read-only filesystem."
        );
      }

      // Return success response with file info
      return NextResponse.json({
        success: true,
        message: "PDF generated successfully",
        filename,
        ...(filepath && { filepath }),
        url: previewUrl,
        ...(storageId && { storageId }),
      });
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error("Error generating PDF:", error);

    // Provide helpful error messages for common issues
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "Failed to generate PDF",
        message: errorMessage,
        platform: process.platform,
        isVercel: !!process.env.VERCEL,
        isProduction: process.env.NODE_ENV === "production",
      },
      { status: 500 }
    );
  }
}
