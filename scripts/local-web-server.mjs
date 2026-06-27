#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const rootDirectory = resolve(fileURLToPath(new URL("../", import.meta.url)));
const mimeTypes = new Map([
  [".avif", "image/avif"],
  [".aac", "audio/aac"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".webm", "video/webm"],
  [".webp", "image/webp"],
]);

const getContentType = (filePath) => mimeTypes.get(extname(filePath).toLowerCase()) || "application/octet-stream";

const parseOptions = () => {
  const options = {
    host: process.env.HOST || "127.0.0.1",
    port: 8080,
  };

  const setPort = (value) => {
    const port = Number(value);

    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      throw new Error(`Invalid port: ${value}`);
    }

    options.port = port;
  };

  if (process.env.PORT) {
    setPort(process.env.PORT);
  }

  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--port" || arg === "-p") {
      index += 1;
      setPort(args[index]);
      continue;
    }

    if (arg.startsWith("--port=")) {
      setPort(arg.slice("--port=".length));
      continue;
    }

    if (arg === "--host" || arg === "-h") {
      index += 1;
      options.host = args[index];
      continue;
    }

    if (arg.startsWith("--host=")) {
      options.host = arg.slice("--host=".length);
      continue;
    }

    if (arg === "--help") {
      console.log("Usage: node scripts/local-web-server.mjs [--host 127.0.0.1] [--port 8080]");
      process.exit(0);
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
};

const isInsideRoot = (filePath) => {
  const normalizedRoot = rootDirectory.toLowerCase();
  const normalizedPath = filePath.toLowerCase();

  return normalizedPath === normalizedRoot || normalizedPath.startsWith(`${normalizedRoot}${sep}`);
};

const sendText = (response, statusCode, text, headers = {}) => {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(text),
    "Content-Type": "text/plain; charset=utf-8",
    ...headers,
  });
  response.end(text);
};

const parseRange = (rangeHeader, size) => {
  const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader || "");

  if (!match) {
    return null;
  }

  let start = match[1] ? Number(match[1]) : null;
  let end = match[2] ? Number(match[2]) : null;

  if (start === null && end === null) {
    return null;
  }

  if (start === null) {
    if (!Number.isSafeInteger(end) || end <= 0) {
      return null;
    }

    start = Math.max(size - end, 0);
    end = size - 1;
  } else {
    if (!Number.isSafeInteger(start) || start < 0) {
      return null;
    }

    if (end === null || end >= size) {
      end = size - 1;
    }
  }

  if (!Number.isSafeInteger(end) || start > end || end >= size) {
    return null;
  }

  return { end, start };
};

const streamFile = (request, response, filePath, fileStats) => {
  const rangeHeader = request.headers.range;
  const contentType = getContentType(filePath);
  const baseHeaders = {
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
    "Content-Type": contentType,
  };

  let statusCode = 200;
  let start = 0;
  let end = fileStats.size - 1;

  if (rangeHeader) {
    const range = parseRange(rangeHeader, fileStats.size);

    if (!range) {
      response.writeHead(416, {
        ...baseHeaders,
        "Content-Range": `bytes */${fileStats.size}`,
      });
      response.end();
      return;
    }

    statusCode = 206;
    start = range.start;
    end = range.end;
    baseHeaders["Content-Range"] = `bytes ${start}-${end}/${fileStats.size}`;
  }

  response.writeHead(statusCode, {
    ...baseHeaders,
    "Content-Length": end - start + 1,
  });

  if (request.method === "HEAD") {
    response.end();
    return;
  }

  const stream = createReadStream(filePath, { end, start });
  stream.on("error", (error) => {
    if (response.headersSent) {
      response.destroy(error);
      return;
    }

    sendText(response, 500, "Internal Server Error");
  });
  stream.pipe(response);
};

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Method Not Allowed", { Allow: "GET, HEAD" });
    return;
  }

  let pathname;
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    sendText(response, 400, "Bad Request");
    return;
  }

  let filePath = resolve(rootDirectory, `.${pathname}`);
  if (!isInsideRoot(filePath)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    let fileStats = await stat(filePath);

    if (fileStats.isDirectory()) {
      filePath = join(filePath, "index.html");
      fileStats = await stat(filePath);
    }

    if (!fileStats.isFile()) {
      sendText(response, 404, "Not Found");
      return;
    }

    streamFile(request, response, filePath, fileStats);
  } catch {
    sendText(response, 404, "Not Found");
  }
});

let options;
try {
  options = parseOptions();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${options.port} is already in use. Try: --port ${options.port + 1}`);
  } else {
    console.error(error.message);
  }

  process.exit(1);
});

server.listen(options.port, options.host, () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port;
  const displayHost = options.host === "0.0.0.0" ? "127.0.0.1" : options.host;

  console.log(`Serving ${rootDirectory}`);
  console.log(`Local: http://${displayHost}:${port}/`);
  console.log("Press Ctrl+C to stop.");
});
