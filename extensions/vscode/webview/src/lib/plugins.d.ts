// Type declarations for the copied remark/rehype plugins (authored as .mjs, like the docs app).
// They are unified Plugins; we type them loosely as () => transformer since they take no options.

declare module "*/remark-superlore-canvas.mjs" {
  export function remarkSuperloreCanvas(): (tree: unknown) => void;
}

declare module "*/rehype-kp-block-ids.mjs" {
  export function rehypeKpBlockIds(): (tree: unknown) => void;
  const _default: () => (tree: unknown) => void;
  export default _default;
}
