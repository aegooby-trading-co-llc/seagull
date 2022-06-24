import { 
    renderStream,
} from "../../../../build/packages/server/renderer/stream.js";

async function _() {
    const controller = new AbortController();
    /** @type {[ReadableStream<Uint8Array>, number]} */
    const [readable, writeable] = await Promise.all([
        renderStream(controller), 
        Deno.core.opAsync("op_create_stream")
    ]);
    const reader = readable.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        } else if (value) {
            await Deno.core.write(writeable, value);
        }
    }
    await reader.closed;
}

if (import.meta.main) {
    try {
        await _();
    } catch (error) {
        console.error(`Embedded JS error: ${error}`);
    }
}

