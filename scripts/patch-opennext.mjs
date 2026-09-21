import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const turbopackPatchPath = path.resolve(
	__dirname,
	"../node_modules/@opennextjs/cloudflare/dist/cli/build/patches/plugins/turbopack.js"
);

if (fs.existsSync(turbopackPatchPath)) {
	let content = fs.readFileSync(turbopackPatchPath, "utf-8");

	// 1. dotNextDir path regex for Windows & POSIX
	content = content.replace(
		'filePath.replace(/\\/server\\/chunks\\/.*$/, "")',
		'filePath.replace(/[\\/\\\\]server[\\/\\\\]chunks[\\/\\\\].*$/, "")'
	);

	// 2. chunkFiles filter normalization
	content = content.replace(
		'tracedFiles.filter((f) => f.includes(".next/server/chunks/"))',
		'tracedFiles.filter((f) => f.replaceAll("\\\\", "/").includes(".next/server/chunks/"))'
	);

	// 3. getInlinableChunks and inlineChunksFn clean forward slash replacement
	const oldChunksPattern = /function getInlinableChunks\(tracedFiles\) \{[\s\S]*?export function loadWasmChunkFn/;

	const newChunksBlock = `function getInlinableChunks(tracedFiles) {
    const chunks = new Set();
    for (const file of tracedFiles) {
        if (file === "[turbopack]_runtime.js") {
            continue;
        }
        const norm = file.replaceAll("\\\\", "/");
        if (norm.includes(".next/server/chunks/")) {
            chunks.add(norm);
        }
    }
    return Array.from(chunks);
}
function inlineChunksFn(tracedFiles) {
    // From the outputs, we extract every chunks
    const chunks = getInlinableChunks(tracedFiles);
    return \`
  function requireChunk(chunkPath) {
    switch(chunkPath) {
\${chunks
        .map((norm) => {
            const relKey = norm.includes("/.next/") ? norm.slice(norm.indexOf("/.next/") + 7) : norm;
            return \`      case "\${relKey}": return require("\${norm}");\`;
        })
        .join("\\n")}
      default:
        throw new Error(\\\`Not found \\\${chunkPath}\\\`);
    }
  }
\`;
}
/**
 * Generate a \`loadWasmChunk\` function that maps a \`.next\`-relative chunk path to a
 * statically-importable \`.wasm\` module.
 *
 * The replacement rules for Turbopack's \`loadWebAssembly{,Module}\` delegate to this
 * function. Because the imports are emitted as string literals, the bundler can
 * statically discover every wasm chunk and include them in the final build.
 */
export function loadWasmChunkFn`;

	if (oldChunksPattern.test(content)) {
		content = content.replace(oldChunksPattern, newChunksBlock);
		fs.writeFileSync(turbopackPatchPath, content, "utf-8");
		console.log("Successfully patched OpenNext Cloudflare Turbopack plugin for Windows compatibility.");
	} else {
		console.log("turbopack.js already has custom inlining logic.");
	}
} else {
	console.log("OpenNext Turbopack plugin not found; skipping patch.");
}
