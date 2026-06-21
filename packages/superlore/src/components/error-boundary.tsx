"use client";

import { Component, type ReactNode } from "react";

/**
 * A compact, in-place error card. One block failing should read as "this block didn't render",
 * not a stack trace and never a blank page. Tokens only, light/dark co-equal — mirrors the
 * Canvas "invalid spec" fallback so failures look intentional.
 */
function BlockError({ name, message }: { name?: string; message?: string }) {
  return (
    <div
      role="alert"
      className="not-prose my-6 rounded-xl border border-[color-mix(in_oklab,var(--kp-danger)_45%,var(--color-fd-border))] bg-[color-mix(in_oklab,var(--kp-danger)_7%,var(--color-fd-card))] p-4 text-sm text-fd-foreground"
    >
      <div className="font-medium">
        {name ? (
          <>
            Couldn’t render <code className="font-mono">{name}</code>.
          </>
        ) : (
          <>Couldn’t render this block.</>
        )}
      </div>
      <p className="mt-1 text-fd-muted-foreground">
        The rest of the page is unaffected. Check this block’s props or spec.
      </p>
      {message ? (
        <pre className="mt-2 overflow-x-auto rounded-md bg-fd-muted/60 p-2 font-mono text-[12px] leading-snug text-fd-muted-foreground">
          {message}
        </pre>
      ) : null}
    </div>
  );
}

interface Props {
  /** The component/block name, shown in the fallback and the console warning. */
  name?: string;
  children: ReactNode;
  /** Override the fallback (e.g. the Canvas spec-specific message). */
  fallback?: ReactNode;
}
interface State {
  message: string | null;
}

/**
 * `Isolate` — a render firewall for a single MDX block. A component that throws (bad props, a
 * malformed canvas spec, a runtime edge case) fails *here* with an inline card; the surrounding
 * page renders normally. Catches client renders and streaming-SSR renders of its subtree.
 *
 * It does not rethrow and has no reset affordance by design: in a docs page a bad block is an
 * authoring bug to fix at the source, not a transient runtime fault to retry.
 */
export class Isolate extends Component<Props, State> {
  override state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { message: error instanceof Error ? error.message : String(error) };
  }

  override componentDidCatch(error: unknown) {
    // Surface for the author; never propagate.
    if (typeof console !== "undefined") {
      console.error(`[superlore] block "${this.props.name ?? "unknown"}" failed to render`, error);
    }
  }

  override render() {
    if (this.state.message !== null) {
      return (
        this.props.fallback ?? <BlockError name={this.props.name} message={this.state.message} />
      );
    }
    return this.props.children;
  }
}
