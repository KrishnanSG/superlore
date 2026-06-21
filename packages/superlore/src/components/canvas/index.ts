export { Canvas, Whiteboard, type CanvasProps } from "./canvas";
export {
  type CanvasSpec,
  type CanvasNodeSpec,
  type CanvasEdgeSpec,
  type CanvasGroupSpec,
  type CanvasShapeKind,
  type CanvasIntent,
  type CanvasEdgeKind,
  canvasSpecSchema,
} from "./types";
export { parseCanvasSpec, normalizeCanvas } from "./parse-spec";
