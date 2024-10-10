// Compresses string to GZIP. Retruns a Promise with Base64 string
export const compress = (string: string): Promise<string> => {
	const blobToBase64 = (blob: Blob) =>
		new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onloadend = () => {
				const res = reader.result;
				if (typeof res === 'string') return resolve(res.split(',')[1]);
			};
			reader.readAsDataURL(blob);
		});
	const byteArray = new TextEncoder().encode(string);
	const cs = new CompressionStream('gzip');
	const writer = cs.writable.getWriter();
	writer.write(byteArray);
	writer.close();
	return new Response(cs.readable).blob().then(blobToBase64);
};

// Decompresses base64 encoded GZIP string. Returns a string with original text.
export const decompress = (base64string: string) => {
	const bytes = Uint8Array.from(atob(base64string), (c) => c.charCodeAt(0));
	const cs = new DecompressionStream('gzip');
	const writer = cs.writable.getWriter();
	writer.write(bytes);
	writer.close();
	return new Response(cs.readable).arrayBuffer().then(function (arrayBuffer) {
		return new TextDecoder().decode(arrayBuffer);
	});
};
