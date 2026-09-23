import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, "../public");

function crc32(buf) {
	let crc = 0xffffffff;
	for (let i = 0; i < buf.length; i++) {
		crc ^= buf[i];
		for (let j = 0; j < 8; j++) {
			crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
		}
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
	const len = Buffer.alloc(4);
	len.writeUInt32BE(data.length, 0);
	const typeBuf = Buffer.from(type, "ascii");
	const crcBuf = Buffer.alloc(4);
	const checksum = crc32(Buffer.concat([typeBuf, data]));
	crcBuf.writeUInt32BE(checksum, 0);
	return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgbaBuffer) {
	const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

	const ihdrData = Buffer.alloc(13);
	ihdrData.writeUInt32BE(width, 0);
	ihdrData.writeUInt32BE(height, 4);
	ihdrData[8] = 8; // bit depth
	ihdrData[9] = 6; // color type: RGBA
	ihdrData[10] = 0; // compression
	ihdrData[11] = 0; // filter
	ihdrData[12] = 0; // interlace
	const ihdrChunk = createChunk("IHDR", ihdrData);

	// Each scanline begins with a filter byte (0 = None)
	const rawScanlines = Buffer.alloc(height * (1 + width * 4));
	for (let y = 0; y < height; y++) {
		const rowOffset = y * (1 + width * 4);
		rawScanlines[rowOffset] = 0; // Filter: None
		rgbaBuffer.copy(rawScanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
	}

	const compressed = zlib.deflateSync(rawScanlines, { level: 9 });
	const idatChunk = createChunk("IDAT", compressed);
	const iendChunk = createChunk("IEND", Buffer.alloc(0));

	return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Procedurally draws the Mailflare mail envelope icon on an RGBA canvas
 */
function renderMailIcon(size, isMaskable = false) {
	const buffer = Buffer.alloc(size * size * 4);

	function setPixel(x, y, r, g, b, a = 255) {
		if (x < 0 || x >= size || y < 0 || y >= size) return;
		const idx = (y * size + x) * 4;
		if (a < 255) {
			const prevA = buffer[idx + 3] / 255;
			const newA = a / 255;
			const outA = newA + prevA * (1 - newA);
			if (outA > 0) {
				buffer[idx] = Math.round((r * newA + buffer[idx] * prevA * (1 - newA)) / outA);
				buffer[idx + 1] = Math.round((g * newA + buffer[idx + 1] * prevA * (1 - newA)) / outA);
				buffer[idx + 2] = Math.round((b * newA + buffer[idx + 2] * prevA * (1 - newA)) / outA);
				buffer[idx + 3] = Math.round(outA * 255);
			}
		} else {
			buffer[idx] = r;
			buffer[idx + 1] = g;
			buffer[idx + 2] = b;
			buffer[idx + 3] = a;
		}
	}

	// If maskable, fill background with brand color #f6f8fc or solid blue
	if (isMaskable) {
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				setPixel(x, y, 2, 132, 199, 255); // #0284c7
			}
		}
	}

	const scale = size / 512;
	const pad = isMaskable ? 50 * scale : 0;
	const iconScale = isMaskable ? (size - pad * 2) / 512 : scale;

	function tx(x) { return Math.round(pad + x * iconScale); }
	function ty(y) { return Math.round(pad + y * iconScale); }

	// Envelope body (darker blue interior)
	// Points: (64, 160) -> (256, 60) -> (448, 160) -> (448, 416) -> (64, 416)
	for (let y = ty(60); y <= ty(420); y++) {
		for (let x = tx(64); x <= tx(448); x++) {
			const nx = (x - pad) / iconScale;
			const ny = (y - pad) / iconScale;

			// Triangle top:
			let inTop = false;
			if (ny >= 60 && ny <= 160) {
				const slope = (160 - 60) / (256 - 64);
				const leftBound = 256 - (ny - 60) / slope;
				const rightBound = 256 + (ny - 60) / slope;
				if (nx >= leftBound && nx <= rightBound) inTop = true;
			}
			const inBottom = ny >= 160 && ny <= 416 && nx >= 64 && nx <= 448;

			if (inTop || inBottom) {
				// Grad: #0284c7 (2, 132, 199) -> #0369a1 (3, 105, 161)
				const t = Math.max(0, Math.min(1, (ny - 60) / 360));
				const r = Math.round(2 + t * 1);
				const g = Math.round(132 - t * 27);
				const b = Math.round(199 - t * 38);
				setPixel(x, y, r, g, b, 255);
			}
		}
	}

	// White Paper inside: (100, 150) to (412, 380)
	for (let y = ty(145); y <= ty(380); y++) {
		for (let x = tx(100); x <= tx(412); x++) {
			setPixel(x, y, 248, 250, 252, 255);
		}
	}

	// Paper text placeholder lines
	const lines = [
		{ y1: 190, y2: 204, x1: 136, x2: 320 },
		{ y1: 222, y2: 236, x1: 136, x2: 376 },
		{ y1: 254, y2: 268, x1: 136, x2: 276 },
	];
	for (const line of lines) {
		for (let y = ty(line.y1); y <= ty(line.y2); y++) {
			for (let x = tx(line.x1); x <= tx(line.x2); x++) {
				setPixel(x, y, 226, 232, 240, 255);
			}
		}
	}

	// Left and Right inner folds
	for (let y = ty(180); y <= ty(432); y++) {
		for (let x = tx(64); x <= tx(448); x++) {
			const nx = (x - pad) / iconScale;
			const ny = (y - pad) / iconScale;

			// Fold lines from (64, 180) to (256, 310) and (448, 180) to (256, 310)
			const leftLineY = 180 + ((310 - 180) / (256 - 64)) * (nx - 64);
			const rightLineY = 180 + ((310 - 180) / (256 - 448)) * (nx - 448);

			if (nx < 256 && ny >= leftLineY && ny <= 432) {
				setPixel(x, y, 14, 165, 233, 255); // #0ea5e9
			} else if (nx >= 256 && ny >= rightLineY && ny <= 432) {
				setPixel(x, y, 2, 132, 199, 255); // #0284c7
			}
		}
	}

	// Front Bottom Envelope flap
	// Triangle from (64, 432) to (256, 295) to (448, 432)
	for (let y = ty(295); y <= ty(440); y++) {
		for (let x = tx(64); x <= tx(448); x++) {
			const nx = (x - pad) / iconScale;
			const ny = (y - pad) / iconScale;

			const slope = (432 - 295) / (256 - 64);
			const leftX = 256 - (ny - 295) / slope;
			const rightX = 256 + (ny - 295) / slope;

			if (nx >= leftX && nx <= rightX && ny <= 440) {
				// Grad: #38bdf8 (56, 189, 248) -> #0284c7 (2, 132, 199)
				const t = (ny - 295) / (440 - 295);
				const r = Math.round(56 - t * 54);
				const g = Math.round(189 - t * 57);
				const b = Math.round(248 - t * 49);
				setPixel(x, y, r, g, b, 255);
			}
		}
	}

	return buffer;
}

const targets = [
	{ name: "icon-192.png", size: 192, maskable: false },
	{ name: "icon-512.png", size: 512, maskable: false },
	{ name: "icon-maskable-512.png", size: 512, maskable: true },
	{ name: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const target of targets) {
	const rgba = renderMailIcon(target.size, target.maskable);
	const png = encodePng(target.size, target.size, rgba);
	const dest = path.join(publicDir, target.name);
	fs.writeFileSync(dest, png);
	console.log(`Generated ${target.name} (${target.size}x${target.size}, ${png.length} bytes)`);
}
