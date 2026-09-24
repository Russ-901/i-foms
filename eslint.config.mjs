import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // This app's pages consistently use "fetch on mount, expose a
      // reusable refresh function" (called from effects, buttons, and after
      // mutations) — the same data-fetching-in-an-effect pattern React's
      // own docs list as valid. This new (eslint-plugin-react-hooks v7)
      // rule flags that shape wherever the fetch helper is reused outside
      // the effect too. Satisfying it would mean duplicating every fetch
      // function or adopting a data-fetching library — out of proportion
      // to the benefit here, so it's turned off rather than worked around.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default eslintConfig;
