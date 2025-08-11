import { Actions } from "jsr:@shougo/ddu-vim@~10.4.0/types";
import { BaseKind } from "jsr:@shougo/ddu-vim@~10.4.0/kind";

type Params = Record<never, never>;

export class Kind extends BaseKind<Params> {
  override params(): Params {
    return {};
  }
  override actions: Actions<Params> = {}
}
