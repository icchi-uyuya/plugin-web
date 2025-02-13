import { z } from "zod";

export const StringArray = z.object({
    array: z.array(z.string())
})