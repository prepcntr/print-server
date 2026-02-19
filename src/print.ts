import os from "os";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface PrintFileOptions {
  copies?: number;
  pages?: string;
  orientation?: "portrait" | "landscape";
  side?: "duplex" | "duplexshort" | "duplexlong" | "simplex";
}

export async function printTest() {
  console.log("Starting print test...");
  // const file = "/Users/michael/projects/print-server/samples/RL1362.pdf";
  const file = "/Users/michael/projects/print-server/samples/sample_label_57mm_x_32mm.pdf";
  const printer = "_4BARCODE_4B_2054N";
  printFile(file, printer, { copies: 2 }).then(() => {
    console.log("Print job sent successfully");
  }).catch((error) => {
    console.error("Error sending print job:", error);
  });
}

export async function listPrinters(): Promise<{ name: string }[]> {
  if (os.platform() === "win32") {
    const { getPrinters } = await import("pdf-to-printer");
    return getPrinters();
  } else {
    const { stdout } = await execAsync("lpstat -a");
    return stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ name: line.split(" ")[0] }));
  }
}

export async function printFile(file: string, printer: string, options: PrintFileOptions = {}) {
  if (os.platform() === "win32") {
    const { print } = await import("pdf-to-printer");
    return print(file, { printer, ...options });
  } else {
    const { print } = await import("unix-print");
    const flags: string[] = [];
    if (options.copies) flags.push(`-n ${options.copies}`);
    if (options.pages) flags.push(`-P ${options.pages}`);
    if (options.orientation === "landscape") flags.push("-o landscape");
    if (options.side) flags.push(`-o sides=${options.side === "simplex" ? "one-sided" : "two-sided-long-edge"}`);
    return print(file, printer, flags);
  }
}