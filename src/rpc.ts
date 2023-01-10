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

interface IHeaders {
  [key: string]: string;
}

const succeed = <A>(a: A, h?: Headers, s?: number) => ({
  type: "succeeded" as const,
  data: a,
  headers: h,
  status: s,
});

const fail = <A>(a: A, h?: Headers, s?: number) => ({
  type: "failed" as const,
  data: a,
  headers: h,
  status: s,
});
export class rpc<A extends Schema> {
  endpoint: string;
  pendingApiRequestsCount: number;
  config: { sharedBody?: { [key: string]: any }; contentType?: string };
  constructor(
    endpoint: string,
    config: { sharedBody?: { [key: string]: any }; contentType?: string } = {
      contentType: "text/plain",
    }
  ) {
    this.endpoint = endpoint;
    this.pendingApiRequestsCount = 0;
    this.config = config;
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
    }
  ) {
    this.pendingApiRequestsCount++;
    try {
      let appliedPath = path.toString();
      let body = options?.body ? options?.body : {};

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

      const contentType =
        (options?.headers && options?.headers["Content-Type"]) ||
        this.config.contentType ||
        "application/json"; // content-typeを変更できるように

      if (this.config?.sharedBody) {
        body = { ...body, ...this.config.sharedBody };
      }

      if (options?.headers && options?.headers["Content-Type"] === undefined) {
        // headerをカスタムする際にcontent-typeが無かったらデフォルトを追加する
        options.headers["Content-Type"] = contentType;
      }
      const data = await fetch(
        `${this.endpoint}${appliedPath}${q ? "?" + q : q}`,
        {
          method: method as string,
          credentials: options?.credentials ? options?.credentials : "omit",
          headers: options?.headers
            ? options.headers
            : {
                "Content-Type": contentType,
              },
          ...(body &&
            String(method).toLowerCase() !== "get" &&
            String(method).toLowerCase() !== "head" && {
              body: JSON.stringify(body),
            }),
        }
      );
      if (data.status === 404) {
        return fail(
          {
            type: "not-found",
            data: "Not Found",
          },
          data.headers
        );
      }

      if (400 <= data.status && data.status <= 500) {
        return fail(
          {
            type: "error",
            data: await data.json(),
          },
          data.headers,
          data.status
        );
      }

      try {
        return succeed(
          (await data.json()) as A["resource"][Path][Method]["response"],
          data.headers,
          data.status
        );
      } catch (e) {
        return fail(
          {
            type: "parse-error" as const,
            data: e,
          },
          data.headers,
          data.status
        );
      }
    } catch (e) {
      return fail({
        type: "network-error" as const,
        data: e,
      });
    } finally {
      this.pendingApiRequestsCount--;
    }
  }
}

/**
 * 指定されたレスポンスが成功かどうかを判断します
 * @param data - APIのレスポンス
 * @throws { Error } - APIのエラー
 */
export const assertIsSuccess = (
  data: ReturnType<typeof fail> | ReturnType<typeof succeed>
): asserts data is ReturnType<typeof succeed> => {
  if (data.type === "failed") {
    throw new Error(
      typeof data.data === "string" ? data.data : JSON.stringify(data.data)
    );
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
