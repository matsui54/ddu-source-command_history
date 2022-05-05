import {
  ActionArguments,
  ActionFlags,
  BaseSource,
  Item,
} from "https://deno.land/x/ddu_vim@v1.6.0/types.ts";
import {
  batch,
  Denops,
  fn,
  gather,
} from "https://deno.land/x/ddu_vim@v1.6.0/deps.ts";

export type ActionData = {
  command: string;
  index: number;
};

type Params = Record<never, never>;

export class Source extends BaseSource<Params> {
  kind = "command_history";
  gather(args: {
    denops: Denops;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const items: Item<ActionData>[] = [];
        try {
          const histnr = await fn.histnr(args.denops, "cmd") as number;
          const hists = await gather(args.denops, async (denops) => {
            for (let i = 1; i <= histnr; i++) {
              await fn.histget(denops, "cmd", i);
            }
          }) as string[];
          for (let i = 1; i <= histnr; i++) {
            const hist = hists[i - 1];
            if (hist.trim().length) {
              items.push({
                word: hist,
                action: { command: hist, index: i },
              });
            }
          }
          controller.enqueue(items.reverse());
        } catch (e) {
          console.error(e);
        }
        controller.close();
      },
    });
  }

  actions = {
    execute: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await batch(denops, async (denops) => {
        await fn.histadd(denops, "cmd", action.command);
        await denops.cmd(action.command);
      });
      return Promise.resolve(ActionFlags.None);
    },
    edit: async ({ denops, items }: ActionArguments<Params>) => {
      const action = items[0]?.action as ActionData;
      await fn.feedkeys(denops, `:${action.command}`, "n");
      return Promise.resolve(ActionFlags.None);
    },
    delete: async ({ denops, items }: ActionArguments<Params>) => {
      await batch(denops, async (denops) => {
        for (const item of items) {
          const action = item?.action as ActionData;
          if (item.action) {
            await fn.histdel(denops, "cmd", action.index);
          }
        }
      });
      // Note: rviminfo! is broken in Vim8 before 8.2.2494
      if (
        await fn.has(denops, "nvim") ||
        await fn.has(denops, "patch-8.2.2494")
      ) {
        await denops.cmd("wviminfo! | rviminfo!");
      }
      return Promise.resolve(ActionFlags.RefreshItems);
    },
  };

  params(): Params {
    return {};
  }
}
