interface APIResponse<T> {
  type: "ok" | "error";
  status: "success" | "failed";
  intent?: string;
  details?: string;
  data?: T;
}

type IsNeverType<T> = [T] extends [never] ? true : false;

type StrictExtract<Union, Cond> = Cond extends Union ? Union : never;
