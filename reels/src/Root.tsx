import { Composition } from "remotion";
import { Reel } from "./Release012";

/** Remotion compositions for superlore release reels — one composition per release. */
export const Root = () => (
  <Composition
    id="Release012"
    component={Reel}
    durationInFrames={720}
    fps={30}
    width={1280}
    height={720}
  />
);
