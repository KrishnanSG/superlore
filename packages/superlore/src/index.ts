// superlore — the agent-native knowledge base component library.
//
// Keep this file directive-free (no "use client") so the build emits directives per component.

export * from "./knowledge";
export { cn } from "./lib/cn";

// Components — Mintlify-compatible primitives + editorial polish + rich visualization +
// the structural-knowledge differentiators (each dual-representation).
export * from "./components/mintlify";
export * from "./components/polish";
export * from "./components/diagram";
export * from "./components/canvas";
export * from "./components/walkthrough";
export * from "./components/timeline";
export * from "./components/entity-card";
export * from "./components/table";
export * from "./components/board";
export * from "./components/releases";
export * from "./components/schedule";
export * from "./components/decision";
export * from "./components/comparison";
export * from "./components/roster";
export * from "./components/checklist";
export { Example, type ExampleProps } from "./components/example";
export { AnnouncementCard, type AnnouncementData } from "./components/announcement";
export { ThemeToggle } from "./components/theme-toggle";
export { BuiltWithSuperlore } from "./components/built-with";

// The MDX component map (spread into your app's useMDXComponents). Importing it registers every
// component's knowledge face.
export { getMDXComponents, useMDXComponents } from "./components/mdx";
