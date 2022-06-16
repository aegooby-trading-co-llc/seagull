import * as React from "react";

import { handlers } from "../handlers.js";
import { HTMLTemplate } from "../html/react.jsx";
import { default as App } from "@lobster/app/App.jsx";

export default handlers({
    reactElement:
        <HTMLTemplate element={<React.StrictMode><App /></React.StrictMode>} />
});
