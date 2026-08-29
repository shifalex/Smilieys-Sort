import { readdir, readFile, rm, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
const includedRoots = ["index.html", "app.js", "styles.css", "manifest.webmanifest", "service-worker.js", "icons", "src"];
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

async function collect(relativePath) {
  const absolutePath = path.join(root, relativePath);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => null);
  if (!entries) return [relativePath];
  const nested = await Promise.all(entries.map(entry => collect(path.join(relativePath, entry.name))));
  return nested.flat();
}

const files = (await Promise.all(includedRoots.map(collect))).flat();
const assets = {};
for (const file of files) {
  const urlPath = `/${file.split(path.sep).join("/")}`;
  assets[urlPath] = {
    body: (await readFile(path.join(root, file))).toString("base64"),
    type: mimeTypes[path.extname(file).toLowerCase()] || "application/octet-stream"
  };
}

const worker = `const assets = ${JSON.stringify(assets)};
const decode = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
export default {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    const asset = assets[pathname];
    if (!asset) return new Response("Not found", { status: 404 });
    const headers = new Headers({ "content-type": asset.type });
    if (pathname === "/service-worker.js") headers.set("service-worker-allowed", "/");
    return new Response(request.method === "HEAD" ? null : decode(asset.body), { headers });
  }
};
`;

await rm(dist, { recursive: true, force: true });
await mkdir(path.join(dist, "server"), { recursive: true });
await writeFile(path.join(dist, "server", "index.js"), worker);
