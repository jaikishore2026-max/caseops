import { COOKIE_NAME } from "../shared/const.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { caseOpsStore } from "./data/investigation.js";

const caseOpsActionInput = z.object({
  caseId: z.string().regex(/^CASE-\d{4}$/, "Expected a synthetic CASE-#### identifier"),
  action: z.enum(["assign", "escalate", "clear", "add-note", "request-review", "close", "approve-exception"]),
  note: z.string().trim().max(2_000).optional(),
});

export const appRouter = router({
  // All case data returned by this public demo router is synthetic.
  caseops: router({
    snapshot: publicProcedure.query(() => caseOpsStore.getSnapshot()),
    applyAction: publicProcedure.input(caseOpsActionInput).mutation(({ input }) => {
      if (input.action === "add-note" && !input.note) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a note before saving." });
      }
      try {
        return caseOpsStore.applyAction(input);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to apply analyst action.";
        throw new TRPCError({
          code: message.startsWith("Unknown synthetic case:") ? "NOT_FOUND" : "BAD_REQUEST",
          message,
          cause: error,
        });
      }
    }),
  }),
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
