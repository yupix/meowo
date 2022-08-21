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

const succeed = <A>(a: A) => ({
	type: "succeeded" as const,
	data: a,
});

const fail = <A>(a: A) => ({
	type: "failed" as const,
	data: a,
});

export default <A extends Schema>(endpoint: string) => ({
	call: async <
		Method extends GrandChildren<A["resource"]>,
		Path extends Owns<A["resource"], Method>,
		Params extends Get<A["resource"][Path][Method], "params">,
		Query extends Get<A["resource"][Path][Method], "query">,
		Body extends Get<A["resource"][Path][Method], "body">,
	>(
		method: Method,
		path: Path,
		options?: {
			isCokkieAuth?: boolean;
			token?: boolean;
			query?: Query;
			headers?: HeadersInit;
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
						(rest[0] as any)[name],
					);
				}
			}

            //@ts-ignore
			const q = QueryCreator(options?.query || {});

			const data = await fetch(`${endpoint}${appliedPath}${q ? "?" + q : q}`, {
				method: method as string,
				credentials:
					options?.isCokkieAuth && options?.token ? "same-origin" : "omit",
				headers: options?.headers ? options.headers : {
					"Content-Type": "text/plain",
				},
				...(
					rest.length !== 1 || paramExists ? {} : {
						body: JSON.stringify(
							options?.token ? { ...rest[0], i: localStorage.getItem("i") } : rest[0],
						),
					}
				),
				...(
					rest.length !== 2 ? {} : {
						body: JSON.stringify(
							options?.token ? { ...rest[1], i: localStorage.getItem("i") } : rest[1],
						),
					}
				),
			});
			if (data.status === 404) {
				return fail({
					type: "not-found",
					data: "Not Found",
				});
			}

			try {
				return succeed(
					await data.json() as A["resource"][Path][Method]["response"],
				);
			} catch (e) {
				return fail({
					type: "parse-error" as const,
					data: e,
				});
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
