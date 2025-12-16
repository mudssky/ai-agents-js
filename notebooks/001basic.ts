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
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage } from "@langchain/core/messages";
const model = new ChatDeepSeek(
  {
    model: "deepseek-chat",
  },
);

await model.invoke([
  new HumanMessage("讲一个笑话"),
]);

// %%
// outputparse可以处理输出
// pipe组装多个 Runnable 对象形成完整的 Chain
import { StringOutputParser } from "@langchain/core/output_parsers";
const outputPrase = new StringOutputParser();
const simpleChain = model.pipe(outputPrase);
await simpleChain.invoke([
  new HumanMessage("讲一个笑话"),
]);

// %%
// 批量调用
await simpleChain.batch([
  [new HumanMessage("讲一个笑话")],
  [new HumanMessage("讲一个冷笑话")],
]);

// %%
// 流式调用
const stream = await simpleChain.stream([
  new HumanMessage("讲一个笑话"),
]);

for await (const chunk of stream) {
  console.log(chunk);
}

// %%
// 流式调用,每次返回对象
const stream = await simpleChain.streamLog([
  new HumanMessage("讲一个笑话"),
]);

for await (const chunk of stream) {
  console.log(chunk);
}

// %%
// fallback
const fakeLLM = new ChatDeepSeek({
  azureOpenAIApiKey: "123",
  maxRetries: 0,
});

await fakeLLM.invoke("你好");

// %%
// 使用withFallbacks在模型不可用时添加替代品，可以在极端环境下保证至少有输出
const llmWithFallback = fakeLLM.withFallbacks({
  fallbacks: [model],
});
await fakeLLM.invoke("你好");
