import { query as QueryCreator } from "./utils";

type GrandChildren<A extends {}> = {
  [I in keyof A]: keyof A[I];
}[keyof A];

type Owns<A extends {}, S extends string | symbol | number> = {
  [I in keyof A]: S extends keyof A[I] ? I : never;
}[keyof A];

type Get<A, K> = K extends keyof A ? A[K] : undefined;

type ExcludeUndefined<X> = X extends [undefined, undefined]
  ? []
  : X extends [infer A, undefined]
  ? [A]
  : X extends [undefined, infer B]
  ? [B]
  : X extends [infer A, infer B]
  ? [A, B]
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

export default <A extends Schema>(endpoint: string, defaultContentType: string) => ({
  call: async <
    Method extends GrandChildren<A["resource"]>,
    Path extends Owns<A["resource"], Method>,
    Params extends Get<A["resource"][Path][Method], "params">,
    Query extends Get<A["resource"][Path][Method], "query">,
    Body extends Get<A["resource"][Path][Method], "body">
  >(
    method: Method,
    path: Path,
    options?: {
      credentials?: RequestCredentials;
      query?: Query;
      headers?: IHeaders;
    },
    ...rest: ExcludeUndefined<[Params, Body]>
  ) => {
    try {
      let appliedPath = path.toString();

      const paramExists = /:[a-zA-Z0-9]+/.test(appliedPath);

      if (paramExists) {
        for (const name in rest[0]) {
          appliedPath = appliedPath.replace(
            new RegExp(`:${name}`),
            (rest[0] as any)[name]
          );
        }
      }

      //@ts-ignore
      const q = QueryCreator(options?.query || {});
      
      const contentType = options?.headers?.get('Content-type') || defaultContentType // content-typeを変更できるように

      if (options?.headers && options?.headers["Content-Type"] === undefined) { // headerをカスタムする際にcontent-typeが無かったらデフォルトを追加する
        options.headers.append('Content-Type', contentType)
      }

      const data = await fetch(`${endpoint}${appliedPath}${q ? "?" + q : q}`, {
        method: method as string,
        credentials: options?.credentials ? options?.credentials : "omit",
        headers: options?.headers
          ? options.headers
          : {
              "Content-Type": contentType,
            },
        ...(rest.length !== 1 || paramExists
          ? {}
          : {
              body: JSON.stringify(rest[0]),
            }),
        ...(rest.length !== 2
          ? {}
          : {
              body: JSON.stringify(rest[1]),
            }),
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
    }
  },
});

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
