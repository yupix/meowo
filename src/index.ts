import rpc from "./rpc";

// @ts-ignore
export const apiClient = <T extends Schema> (host: string) => rpc<T>(host);
