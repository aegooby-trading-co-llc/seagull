/**
 * This file seems useless. Don't remove it. It's not useless.
 * Why? Let me tell you, child. It imports all the entry points
 * so that ESBuild pulls them out to the root level as chunks.
 * Why? Stop asking so many questions. Ok. Fine. That was harsh.
 * When they get pulled out as chunks, it preserves the URLs on
 * file imports so that static files load correctly.
 */
import "./app/entry/bundle.jsx";
// import "./app/entry/graphiql.jsx";