import { docs } from "collections/server";
import { loader } from "superlore/source";
import { lucideIconsPlugin } from "superlore/source";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});
