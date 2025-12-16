import { z } from "zod";
const stringSchema = z.string();
stringSchema.parse("Hello, Zod!");
