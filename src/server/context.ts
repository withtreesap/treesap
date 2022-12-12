import { Route } from "./types.ts";

export class ServerContext {
  routes: Route[];

  constructor(routes: Route[]) {
    this.routes = routes;
  }
}
