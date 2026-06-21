import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/**
 * Minimal `next/dynamic` replacement for the browser webview.
 *
 * superlore's Canvas uses `dynamic(() => import("./canvas-island"), { ssr: false, loading })`.
 * In a plain Vite/React app there is no SSR, so `ssr: false` is a no-op; we just wrap the lazy
 * import in <Suspense> with the provided loading fallback. The shape matches the single way
 * superlore calls `dynamic` (a factory returning a default-exporting module).
 */
interface DynamicOptions {
  ssr?: boolean;
  loading?: () => ReactNode;
}

type ModuleFactory<P> = () => Promise<{ default: ComponentType<P> }>;

export default function dynamic<P extends object>(
  factory: ModuleFactory<P>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const Lazy = lazy(factory);
  const fallback = options.loading ? options.loading() : null;
  const Dynamic = (props: P): ReactNode => (
    <Suspense fallback={fallback}>
      <Lazy {...props} />
    </Suspense>
  );
  Dynamic.displayName = "SuperloreDynamic";
  return Dynamic;
}
