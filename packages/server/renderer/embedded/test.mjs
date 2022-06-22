import { 
    renderStream 
} from "../../../../build/packages/server/renderer/stream.js";

if (import.meta.main) {
    /** @type {ReadableStream<Uint8Array>} */
    const readable = await renderStream();
    for await (const chunk of readable) {
        console.log(new TextDecoder().decode(chunk));
    }
}