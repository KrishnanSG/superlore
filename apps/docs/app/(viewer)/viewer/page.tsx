import type { Metadata } from "next";
import { ViewerClient } from "./viewer-client";

export const metadata: Metadata = {
  title: "Viewer",
  description:
    "Drop a superlore .mdx (or plain .md) and see it rendered live — every superlore component, the full theme. Nothing leaves your browser.",
};

export default function ViewerPage() {
  return <ViewerClient />;
}
