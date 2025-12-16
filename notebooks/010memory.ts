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
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
const history = new ChatMessageHistory();
await history.addMessage(new HumanMessage("hi"));
await history.addMessage(new AIMessage("What can I do for you?"));
const messages = await history.getMessages();
messages;

// %% [markdown]
// ```typescript
// export abstract class BaseChatMessageHistory extends Serializable {
//   public abstract getMessages(): Promise<BaseMessage[]>;
//
//   public abstract addMessage(message: BaseMessage): Promise<void>;
//
//   public abstract addUserMessage(message: string): Promise<void>;
//
//   public abstract addAIChatMessage(message: string): Promise<void>;
//
//   public abstract clear(): Promise<void>;
// }
// ```

// %%
// 手动维护
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";

const chatModel = new ChatDeepSeek({
  model: "deepseek-chat",
});
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful assistant. Answer all questions to the best of your ability.
    You are talkative and provides lots of specific details from its context. 
    If the you does not know the answer to a question, it truthfully says you do not know.`,
  ],
  new MessagesPlaceholder("history_message"),
]);

const chain = prompt.pipe(chatModel);

const history = new ChatMessageHistory();
await history.addMessage(new HumanMessage("hi, my name is Kai"));
const res1 = await chain.invoke({
  history_message: await history.getMessages(),
});
res1;

// %%
// 这里把对话的结果也手动添加到历史记录中
await history.addMessage(res1);
await history.addMessage(new HumanMessage("What is my name?"));
const res2 = await chain.invoke({
  history_message: await history.getMessages(),
});
res2;

// %% [markdown]
// RunnableWithMessageHistory 有几个参数：
//
// - runnable 就是需要被包裹的 chain，可以是任意 chain
// - getMessageHistory 接收一个函数，函数需要根据传入的 _sessionId，去获取对应的
//   ChatMessageHistory 对象，这里我们没有 session 管理，所以就返回默认的对象
// - inputMessagesKey 用户传入的信息 key 的名称，因为 RunnableWithMessageHistory
//   要自动记录用户和 llm 发送的信息，所以需要在这里声明用户以什么 key 传入信息
// - historyMessagesKey，聊天记录在 prompt 中的 key，因为要自动的把聊天记录注入到
//   prompt 中。 outputMessagesKey，因为我们的 chain
//   只有一个输出就省略了，如果有多个输出需要指定哪个是 llm
//   的回复，也就是需要存储的信息。

// %%
// 自动维护chat history，由 RunnableWithMessageHistory 给任意 chain 包裹一层，就能添加聊天记录管理的能力
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
const chatModel = new ChatDeepSeek({
  model: "deepseek-chat",
});
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You are a helpful assistant. Answer all questions to the best of your ability.",
  ],
  new MessagesPlaceholder("history_message"),
  ["human", "{input}"],
]);

const history = new ChatMessageHistory();
const chain = prompt.pipe(chatModel);

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: (_sessionId) => history,
  inputMessagesKey: "input",
  historyMessagesKey: "history_message",
});
const res1 = await chainWithHistory.invoke({
  input: "hi, my name is Kai",
}, {
  configurable: { sessionId: "none" },
});
res1;

// %%
const res2 = await chainWithHistory.invoke({
  input: "我的名字叫什么？",
}, {
  configurable: { sessionId: "none" },
});
res2;

// %%
await history.getMessages();

// %%
// RunnableWithMessageHistory 是将历史记录完整的传递到 llm中，我们可以对 llm 的历史记录进行更多操作，例如只传递最近的 k 条历史记录等。

// 下面是一个总结历史记录的chain接收两个参数，
// summary，上一次总结的信息
// new_lines，用户和 llm 新的回复
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const summaryModel = new ChatDeepSeek({
  model: "deepseek-chat",
});
const summaryPrompt = ChatPromptTemplate.fromTemplate(`
Progressively summarize the lines of conversation provided, adding onto the previous summary returning a new summary

Current summary:
{summary}

New lines of conversation:
{new_lines}

New summary:
`);

const summaryChain = RunnableSequence.from([
  summaryPrompt,
  summaryModel,
  new StringOutputParser(),
]);

const newSummary = await summaryChain.invoke({
  summary: "",
  new_lines: "I'm 18",
});
await summaryChain.invoke({
  summary: newSummary,
  new_lines: "I'm male",
});

// %% [markdown]
// 我们使用 new RunnablePassthrough({func: (input)=> void})，是有两个目的：
//
// - 如果我们只写 new RunnablePassthrough()，那就是把用户输入的 input
//   再传递到下一个 runnable 节点中，不做任何操作。因为 RunnableMap
//   返回值是对其中每个 chain 执行，然后将返回值作为结果传递给下一个 runnable
//   节点，如果我们不对 input 使用 RunnablePassthrough 则下个节点就拿不到 input
//   的值
// - new RunnablePassthrough({func: (input)=> void}) 中的 func 函数是在传递 input
//   的过程中，执行一个函数，这个函数返回值是
//   void，也就是无论其内容是什么，都不会对 input 造成影响。

// %%
import { RunnablePassthrough } from "@langchain/core/runnables";
import { getBufferString } from "langchain/memory";
const chatModel = new ChatDeepSeek({
  model: "deepseek-chat",
});
const chatPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful assistant. Answer all questions to the best of your ability.

    Here is the chat history summary:
    {history_summary}
    `,
  ],
  ["human", "{input}"],
]);
let summary = "";
const history = new ChatMessageHistory();

const chatChain = RunnableSequence.from([
  {
    input: new RunnablePassthrough({
      func: (input) => history.addUserMessage(input),
    }),
  },
  RunnablePassthrough.assign({
    history_summary: () => summary,
  }),
  chatPrompt,
  chatModel,
  new StringOutputParser(),
  new RunnablePassthrough({
    func: async (input) => {
      history.addAIChatMessage(input);
      const messages = await history.getMessages();
      const new_lines = getBufferString(messages);
      const newSummary = await summaryChain.invoke({
        summary,
        new_lines,
      });
      history.clear();
      summary = newSummary;
    },
  }),
]);

// %%
await chatChain.invoke("我现在饿了");

// %%
await chatChain.invoke("我今天想吃方便面");

// %%
summary;
