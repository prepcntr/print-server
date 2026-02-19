import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Busboy from "busboy";
import { printFile, listPrinters, PrintFileOptions } from "./print";

const PORT = 9100;
const TMP_DIR = path.join(os.tmpdir(), "print-server");

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

function jsonResponse(
  res: http.ServerResponse,
  status: number,
  body: object
) {
  res.writeHead(status, corsHeaders());
  res.end(JSON.stringify(body));
}

interface ParsedForm {
  filePath?: string;
  printer?: string;
  options?: PrintFileOptions;
}

function parseMultipart(
  req: http.IncomingMessage
): Promise<ParsedForm> {
  return new Promise((resolve, reject) => {
    const result: ParsedForm = {};
    const fields: Record<string, string> = {};
    let fileWritePromise: Promise<void> | null = null;

    if (!fs.existsSync(TMP_DIR)) {
      fs.mkdirSync(TMP_DIR, { recursive: true });
    }

    const busboy = Busboy({ headers: req.headers });

    busboy.on("file", (_fieldname, fileStream, info) => {
      const ext = path.extname(info.filename) || ".pdf";
      const tmpPath = path.join(TMP_DIR, `print-${Date.now()}${ext}`);
      const writeStream = fs.createWriteStream(tmpPath);
      fileStream.pipe(writeStream);
      fileWritePromise = new Promise<void>((res, rej) => {
        writeStream.on("close", () => {
          result.filePath = tmpPath;
          res();
        });
        writeStream.on("error", rej);
      });
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("close", async () => {
      if (fileWritePromise) {
        await fileWritePromise;
      }
      result.printer = fields.printer;
      if (fields.options) {
        try {
          result.options = JSON.parse(fields.options);
        } catch {
          // ignore invalid JSON, use defaults
        }
      }
      resolve(result);
    });

    busboy.on("error", reject);
    req.pipe(busboy);
  });
}

async function handlePrint(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  let tmpFile: string | undefined;
  try {
    const { filePath, printer, options } = await parseMultipart(req);
    tmpFile = filePath;

    if (!filePath) {
      return jsonResponse(res, 400, { error: "file is required" });
    }
    if (!printer) {
      return jsonResponse(res, 400, { error: "printer is required" });
    }

    await printFile(filePath, printer, options || {});
    jsonResponse(res, 200, { success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Print failed";
    jsonResponse(res, 500, { error: message });
  } finally {
    if (tmpFile) {
      fs.unlink(tmpFile, () => {});
    }
  }
}

async function handlePrinters(
  _req: http.IncomingMessage,
  res: http.ServerResponse
) {
  try {
    const printers = await listPrinters();
    jsonResponse(res, 200, { printers });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to list printers";
    jsonResponse(res, 500, { error: message });
  }
}

export function startServer(): http.Server {
  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, corsHeaders());
      res.end();
      return;
    }

    const url = new URL(req.url!, `http://localhost:${PORT}`);

    if (url.pathname === "/print" && req.method === "POST") {
      return handlePrint(req, res);
    }
    if (url.pathname === "/printers" && req.method === "GET") {
      return handlePrinters(req, res);
    }
    if (url.pathname === "/health" && req.method === "GET") {
      return jsonResponse(res, 200, { status: "ok" });
    }

    jsonResponse(res, 404, { error: "Not found" });
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Print server listening on http://127.0.0.1:${PORT}`);
  });

  return server;
}
