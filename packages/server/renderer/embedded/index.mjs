import { 
    renderStream
} from "../../../../build/packages/server/renderer/stream.js";
import { reader } from "./reader.mjs";

if (import.meta.main) {
    await reader(renderStream);
}

