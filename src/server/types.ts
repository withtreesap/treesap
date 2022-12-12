

// deno-lint-ignore no-explicit-any
export interface Route {
  pattern: string;
  url: string;
  name: string;
  csp: boolean;
}