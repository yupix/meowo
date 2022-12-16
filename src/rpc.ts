import { query as QueryCreator } from "./utils";

type GrandChildren<A extends {}> = {
  [I in keyof A]: keyof A[I];
}[keyof A];

type Owns<A extends {}, S extends string | symbol | number> = {
  [I in keyof A]: S extends keyof A[I] ? I : never;
}[keyof A];

type Get<A, K> = K extends keyof A ? A[K] : undefined;

type ExcludeUndefined<X> = X extends undefined
  ? never
  : X extends infer A
  ? A
  : never;

const succeed = <A>(a: A, h?: Headers) => ({
  type: "succeeded" as const,
  data: a,
  headers: h,
});

const fail = <A>(a: A, h?: Headers) => ({
  type: "failed" as const,
  data: a,
  headers: h,
});
export class rpc<A extends Schema>{
  endpoint: string
  defaultContentType: string
  pendingApiRequestsCount: number
  constructor(endpoint: string, defaultContentType: string) {
    this.endpoint = endpoint
    this.defaultContentType = defaultContentType
    this.pendingApiRequestsCount = 0
  }
  async call<
    Method extends GrandChildren<A["resource"]>,
    Path extends Owns<A["resource"], Method>,
    Params extends Get<A["resource"][Path][Method], "params">,
    Query extends Get<A["resource"][Path][Method], "query">,
    Body extends Get<A["resource"][Path][Method], "body">
  >(
    method: Method,
    path: Path,
    options?: {
      body?: ExcludeUndefined<Body>;
      params?: ExcludeUndefined<Params>;
      credentials?: RequestCredentials;
      query?: Query;
      headers?: IHeaders;
    },
  ) {
    this.pendingApiRequestsCount++
    try {
      let appliedPath = path.toString();

      const paramExists = /:[a-zA-Z0-9]+/.test(appliedPath);

      if (paramExists) {
        for (const name in options?.params) {
          appliedPath = appliedPath.replace(
            new RegExp(`:${name}`),
            (options?.params as any)[name]
          );
        }
      }

      //@ts-ignore
      const q = QueryCreator(options?.query || {});

      const contentType = options?.headers?.get('Content-type') || this.defaultContentType // content-typeを変更できるように

      if (options?.headers && options?.headers["Content-Type"] === undefined) { // headerをカスタムする際にcontent-typeが無かったらデフォルトを追加する
        options.headers.append('Content-Type', contentType)
      }
      const data = await fetch(`${this.endpoint}${appliedPath}${q ? "?" + q : q}`, {
        method: method as string,
        credentials: options?.credentials ? options?.credentials : "omit",
        headers: options?.headers
          ? options.headers
          : {
            "Content-Type": contentType,
          },
        ...(options?.body
          ? {
            body: JSON.stringify(options?.body),
          }
          : {}),
      });
      if (data.status === 404) {
        return fail(
          {
            type: "not-found",
            data: "Not Found",
          },
          data.headers
        );
      }

      try {
        return succeed(
          (await data.json()) as A["resource"][Path][Method]["response"],
          data.headers
        );
      } catch (e) {
        return fail(
          {
            type: "parse-error" as const,
            data: e,
          },
          data.headers
        );
      }
    } catch (e) {
      return fail({
        type: "network-error" as const,
        data: e,
      });
    } finally {
      this.pendingApiRequestsCount--
    }
  }
};

export type Schema = {
  resource: {
    [path: string]: {
      [method: string]: {
        params?: {};
        body?: {};
        response: unknown;
      };
    };
  };
};
