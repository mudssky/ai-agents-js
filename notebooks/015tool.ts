// -*- coding: utf-8 -*-
// ---
// jupyter:
//   jupytext:
//     text_representation:
//       extension: .ts
//       format_name: percent
//       format_version: '1.3'
//       jupytext_version: 1.18.1
//   kernelspec:
//     display_name: Deno
//     language: typescript
//     name: deno
// ---

// %%
import { z } from "npm:zod";
const stringSchema = z.string();
stringSchema.parse("Hello, Zod!");

// %%
stringSchema.parse(2323);

// %%
// 基础类型
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();

// 数组
const stringArraySchema = z.array(z.string());
stringArraySchema.parse(["apple", "banana", "cherry"]);

// 对象
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  // 可选类型
  isStudent: z.boolean().optional(),
  // 默认值
  home: z.string().default("no home"),
});

// 联合类型
const mixedTypeSchema = z.union([z.string(), z.number()]);
mixedTypeSchema.parse("hello");
mixedTypeSchema.parse(42);

// %%
import { zodToJsonSchema } from "zod-to-json-schema";
const getCurrentWeatherSchema = z.object({
  location: z.string().describe("The city and state, e.g. San Francisco, CA"),
  unit: z.enum(["celsius", "fahrenheit"]).describe("The unit of temperature"),
});
const paramSchema = zodToJsonSchema(getCurrentWeatherSchema);
paramSchema;

// %%
import { ChatDeepSeek } from "@langchain/deepseek";
import { zodToJsonSchema } from "zod-to-json-schema";
import { ChatPromptTemplate } from "@langchain/core/prompts";
const model = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0,
});
const modelWithTools = model.bind({
  tools: [
    {
      type: "function",
      function: {
        name: "getCurrentWeather",
        description: "Get the current weather in a given location",
        parameters: zodToJsonSchema(getCurrentWeatherSchema),
      },
    },
  ],
});
const prompt = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant"],
  ["human", "{input}"],
]);
const chain = prompt.pipe(modelWithTools);
await chain.invoke({
  input: "北京的天气怎么样",
});

// %%
const getCurrentTimeSchema = z.object({
  format: z
    .enum(["iso", "locale", "string"])
    .optional()
    .describe("The format of the time, e.g. iso, locale, string"),
});

const modelWithMultiTools = model.bind({
  tools: [
    {
      type: "function",
      function: {
        name: "getCurrentWeather",
        description: "Get the current weather in a given location",
        parameters: zodToJsonSchema(getCurrentWeatherSchema),
      },
    },
    {
      type: "function",
      function: {
        name: "getCurrentTime",
        description: "Get the current time in a given format",
        parameters: zodToJsonSchema(getCurrentTimeSchema),
      },
    },
  ],
});
