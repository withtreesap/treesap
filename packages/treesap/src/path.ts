export interface PathMatchResult {
  params: Record<string, string>;
}

export interface CompiledPath {
  pattern: string;
  test(pathname: string): PathMatchResult | null;
}

export function normalizePattern(pattern: string) {
  if (!pattern || pattern === "*") {
    return "/*";
  }

  if (!pattern.startsWith("/")) {
    return `/${pattern}`;
  }

  return pattern;
}

export function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isExactPathPattern(pattern: string) {
  const normalizedPattern = normalizePattern(pattern);

  return !normalizedPattern.includes("*") && !normalizedPattern.includes(":");
}

export function compilePath(pattern: string): CompiledPath {
  const normalizedPattern = normalizePattern(pattern);
  const matcher = new URLPattern({ pathname: normalizedPattern });

  return {
    pattern: normalizedPattern,
    test(pathname: string) {
      const normalizedPathname = normalizePathname(pathname);
      const match = matcher.exec({ pathname: normalizedPathname });
      if (!match) {
        return null;
      }

      const params = Object.fromEntries(
        Object.entries(match.pathname.groups).filter(([name, value]) => {
          return !/^\d+$/.test(name) && typeof value === "string";
        })
      );

      return { params };
    },
  };
}

export function joinPaths(prefix: string, pathName: string) {
  if (!prefix || prefix === "/") {
    return pathName || "/";
  }

  if (!pathName || pathName === "/") {
    return prefix;
  }

  const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
  const normalizedPath = pathName.startsWith("/") ? pathName : `/${pathName}`;

  return `${normalizedPrefix}${normalizedPath}`;
}
