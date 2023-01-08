import { rpc } from "./rpc";

// @ts-ignore
export const apiClient = <T extends Schema>(
  host: string,
  config: { sharedBody?: { [key: string]: any }; contentType: string }
) => new rpc<T>(host, config);
