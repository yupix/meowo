import rpc from "./rpc";

// @ts-ignore
export const apiClient = <T extends Schema> (host: string, contentType: string = 'text/plain') => rpc<T>(host, contentType);
