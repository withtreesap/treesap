

export class ServerContext {
  dev;
  routes;
  staticFiles;

  constructor(routes, staticFiles) {
    this.dev = typeof Deno.env.get("DENO_DEPLOYMENT_ID") !== "string"; // Env var is only set in prod (on Deploy).
    this.routes = routes;
    this.staticFiles = staticFiles;
  }

  static async fromManifest(manifest) {
    // Get the manifest' base URL.
    const baseUrl = new URL("./", manifest.baseUrl).href;
  

    const routes = [];

    return new ServerContext(routes);
  }
}
