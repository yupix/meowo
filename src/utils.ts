export function query(
  obj: Record<string, string | number | boolean | undefined>
): string {
  const params = Object.entries(obj)
    .filter(([, v]) => (Array.isArray(v) ? v.length : v !== undefined))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .reduce(
      (a, [k, v]) => ((a[k] = v!), a),
      {} as Record<string, string | number | boolean>
    );

  return Object.entries(params)
    .map((e) => `${e[0]}=${encodeURIComponent(e[1])}`)
    .join("&");
}
