import { BaseKind } from "https://deno.land/x/ddu_vim@v2.0.0/types.ts";

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  params(): Params {
    return {};
  }
}
