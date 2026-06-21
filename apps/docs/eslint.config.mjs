import base from "../../eslint.config.mjs";

// superlore's docs app reuses the workspace base config. (Next 16 dropped `next lint`; the base's
// react / hooks / a11y rules cover the app.)
export default [...base, { ignores: [".next/**", ".source/**", "out/**", "next-env.d.ts"] }];
