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
// 这是不支持LCEL的，所以定制会比较麻烦。但是可以方便地实现记忆对话。
import { deepSeekChatModel } from "./models/index.ts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";

const memory = new BufferMemory();
const chain = new ConversationChain({ llm: deepSeekChatModel, memory: memory });
const res1 = await chain.call({ input: "我是小明" });
res1;

// %%
const res2 = await chain.call({ input: "我叫什么？" });
res2;

// %% [markdown]
// 内置Memory的机制\
// 首先是 BufferWindowMemory：

// %%
// 导入BufferWindowMemory
// 这里非常好理解，就是对聊天记录加了一个滑动窗口，只会记忆 k 个对话
// 可以节省token
import { BufferWindowMemory } from "@langchain/core/memory";
const memory = new BufferWindowMemory({ k: 1 });
const chain = new ConversationChain({ llm: model, memory: memory });

// %% [markdown]
// ConversationSummaryMemory,官网提供的，随着聊天不断生成聊天记录摘要

// %%
import { ConversationSummaryMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
const memory = new ConversationSummaryMemory({
  memoryKey: "summary",
  llm: new ChatDeepSeek({
    model: "deepseek-chat",
    verbose: true,
  }),
});

const model = deepSeekChatModel;
const prompt = PromptTemplate.fromTemplate(`
你是一个乐于助人的助手。尽你所能回答所有问题。

这是聊天记录的摘要:
{summary}
Human: {input}
AI:`);
const chain = new ConversationChain({
  llm: model,
  prompt,
  memory,
  verbose: true,
});

const res1 = await chain.call({ input: "我是小明" });
const res2 = await chain.call({ input: "我叫什么？" });

// %% [markdown]
// 将 BufferWindowMemory 和 ConversationSummaryMemory 结合起来，根据 token
// 数量，如果上下文历史过大时就切换到
// summary，如果上下文比较小时就使用原始的聊天记录，也就成了
// ConversationSummaryBufferMemory。

// %%
import { ConversationSummaryBufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatDeepSeek } from "@langchain/deepseek";

// 目前不支持deepseek模型的token数计算
const model = deepSeekChatModel;
const memory = new ConversationSummaryBufferMemory({
  llm: new ChatDeepSeek({
    model: "deepseek-chat",
    verbose: true,
  }),
  maxTokenLimit: 200,
});
const chain = new ConversationChain({
  llm: model,
  memory: memory,
  verbose: true,
});
const res1 = await chain.call({ input: "我是小明" });
console.log({ res1 });
const res2 = await chain.call({ input: "我叫什么？" });
console.log({ res2 });

// %% [markdown]
// EntityMemory
//
// 在人类聊天的过程中，我们实际在建立的是对各种实体（Entity）的记忆，例如两个刚认识的人，我们聊职业、聊公司、聊餐馆，我们记忆中存储方式可能是根据实体进行分类存储，这个人是什么职业、年龄；这个公司是什么情况；餐馆是什么环境和味道。EntityMemory
// 希望模拟的就是在聊天中去生成和更新不同的实体的描述。

// %%
import {
  ENTITY_MEMORY_CONVERSATION_TEMPLATE,
  EntityMemory,
} from "langchain/memory";
import { ConversationChain } from "langchain/chains";

const model = deepSeekChatModel;
const memory = new EntityMemory({
  llm: new ChatDeepSeek({
    model: "deepseek-chat",
    verbose: true,
  }),
  chatHistoryKey: "history",
  entitiesKey: "entities",
});
const chain = new ConversationChain({
  llm: model,
  prompt: ENTITY_MEMORY_CONVERSATION_TEMPLATE,
  memory: memory,
  verbose: true,
});

const res1 = await chain.call({ input: "我是小明" });
console.log({ res1 });
const res2 = await chain.call({ input: "我叫什么？" });
console.log({ res2 });
