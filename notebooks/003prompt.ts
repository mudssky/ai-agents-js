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
// 无变量prompt
import { PromptTemplate } from "@langchain/core/prompts";

const greetingPrompt = new PromptTemplate({
  inputVariables: [],
  template: "hello world",
});
const formattedGreetingPrompt = await greetingPrompt.format();

console.log(formattedGreetingPrompt);

// %%
// 含变量的模板
const personalizedGreetingPrompt = new PromptTemplate({
  inputVariables: ["name"],
  template: "hello，{name}",
});
const formattedPersonalizedGreeting = await personalizedGreetingPrompt.format({
  name: "Kai",
});

console.log(formattedPersonalizedGreeting);
// hello，Kai

// %%
// 多变量的模板和上面类似
const multiVariableGreetingPrompt = new PromptTemplate({
  inputVariables: ["timeOfDay", "name"],
  template: "good {timeOfDay}, {name}",
});
const formattedMultiVariableGreeting = await multiVariableGreetingPrompt.format(
  {
    timeOfDay: "morning",
    name: "Kai",
  },
);

console.log(formattedMultiVariableGreeting);
// good morning, Kai

// %%
// 可以用{{}}来转义{}，实现括号的输出
const multiVariableGreetingPrompt = new PromptTemplate({
  inputVariables: ["timeOfDay", "name"],
  template: "good {timeOfDay}, {name} {{test}}",
});
const formattedMultiVariableGreeting = await multiVariableGreetingPrompt.format(
  {
    timeOfDay: "morning",
    name: "Kai",
  },
);

console.log(formattedMultiVariableGreeting);
// good morning, Kai {test}

// %%
// 有个简单的方式，可以自动推断模板的变量
const autoInferTemplate = PromptTemplate.fromTemplate(
  "good {timeOfDay}, {name}",
);
console.log(autoInferTemplate.inputVariables);
// ['timeOfDay', 'name']

const formattedAutoInferTemplate = await autoInferTemplate.format({
  timeOfDay: "morning",
  name: "Kai",
});
console.log(formattedAutoInferTemplate);
// good morning, Kai

// %%
Deno.version;

// %%
// 分步使用部分参数创建template
const initialPrompt = new PromptTemplate({
  template: "这是一个{type}，它是{item}。",
  inputVariables: ["type", "item"],
});

const partialedPrompt = await initialPrompt.partial({
  type: "工具",
});

const formattedPrompt = await partialedPrompt.format({
  item: "锤子",
});

console.log(formattedPrompt);
// 这是一个工具，它是锤子。

const formattedPrompt2 = await partialedPrompt.format({
  item: "改锥",
});

console.log(formattedPrompt2);
// 这是一个工具，它是改锥。

// %%
// 动态填充参数
// 当我们需要，一个 prompt template 被 format 时，实时地动态生成参数时，我们可以使用函数来对 template 部分参数进行指定。
const getCurrentDateStr = () => {
  return new Date().toLocaleDateString();
};

const promptWithDate = new PromptTemplate({
  template: "今天是{date}，{activity}。",
  inputVariables: ["date", "activity"],
});

const partialedPromptWithDate = await promptWithDate.partial({
  date: getCurrentDateStr,
});

const formattedPromptWithDate = await partialedPromptWithDate.format({
  activity: "我们去爬山",
});

console.log(formattedPromptWithDate);
// 输出: 今天是2023/7/13，我们去爬山。

// %%
// 官方api没有支持传参，但是这里可以通过闭包来实现传入当前时间。。。
const getCurrentDateStr = () => {
  return new Date().toLocaleDateString();
};

function generateGreeting(timeOfDay) {
  return () => {
    const date = getCurrentDateStr();
    switch (timeOfDay) {
      case "morning":
        return date + " 早上好";
      case "afternoon":
        return date + " 下午好";
      case "evening":
        return date + " 晚上好";
      default:
        return date + " 你好";
    }
  };
}

const prompt = new PromptTemplate({
  template: "{greeting}!",
  inputVariables: ["greeting"],
});

const currentTimeOfDay = "afternoon";
const partialPrompt = await prompt.partial({
  greeting: generateGreeting(currentTimeOfDay),
});

const formattedPrompt = await partialPrompt.format();

console.log(formattedPrompt);
// 输出: 3/21/2024 下午好!

// %%
// 为了方便地构建和处理结构化的聊天消息，LangChain 提供了几种与聊天相关的提示模板类，如 ChatPromptTemplate、SystemMessagePromptTemplate、AIMessagePromptTemplate 和 HumanMessagePromptTemplate。

import { SystemMessagePromptTemplate } from "@langchain/core/prompts";

const translateInstructionTemplate = SystemMessagePromptTemplate.fromTemplate(
  `你是一个专
业的翻译员，你的任务是将文本从{source_lang}翻译成{target_lang}。`,
);

import { HumanMessagePromptTemplate } from "@langchain/core/prompts";

const userQuestionTemplate = HumanMessagePromptTemplate.fromTemplate(
  "请翻译这句话：{text}",
);

import { ChatPromptTemplate } from "@langchain/core/prompts";

const chatPrompt = ChatPromptTemplate.fromMessages([
  translateInstructionTemplate,
  userQuestionTemplate,
]);

const formattedChatPrompt = await chatPrompt.formatMessages({
  source_lang: "中文",
  target_lang: "法语",
  text: "你好，世界",
});

console.log(formattedChatPrompt);

// %%
// 简便写法，不需要new很多template，直接传入字符串
const systemTemplate =
  "你是一个专业的翻译员，你的任务是将文本从{source_lang}翻译成{target_lang}。";
const humanTemplate = "请翻译这句话：{text}";

const chatPrompt = ChatPromptTemplate.fromMessages([
  ["system", systemTemplate],
  ["human", humanTemplate],
]);

// %%
import { ChatDeepSeek } from "@langchain/deepseek";
import { StringOutputParser } from "@langchain/core/output_parsers";

const chatModel = new ChatDeepSeek({
  model: "deepseek-chat",
});
const outputPraser = new StringOutputParser();

const chain = chatPrompt.pipe(chatModel).pipe(outputPraser);

await chain.invoke({
  source_lang: "中文",
  target_lang: "法语",
  text: "你好，世界",
});
// "Bonjour, le monde"

// %%
// 组合多个prompt PipelinePromptTemplate

import {
  PipelinePromptTemplate,
  PromptTemplate,
} from "@langchain/core/prompts";

const getCurrentDateStr = () => {
  return new Date().toLocaleDateString();
};

const fullPrompt = PromptTemplate.fromTemplate(`
你是一个智能管家，今天是 {date}，你的主人的信息是{info}, 
根据上下文，完成主人的需求
{task}`);

const datePrompt = PromptTemplate.fromTemplate("{date}，现在是 {period}");
const periodPrompt = await datePrompt.partial({
  date: getCurrentDateStr,
});

const infoPrompt = PromptTemplate.fromTemplate(
  "姓名是 {name}, 性别是 {gender}",
);

const taskPrompt = PromptTemplate.fromTemplate(`
我想吃 {period} 的 {food}。 
再重复一遍我的信息 {info}`);

const composedPrompt = new PipelinePromptTemplate({
  pipelinePrompts: [
    {
      name: "date",
      prompt: periodPrompt,
    },
    {
      name: "info",
      prompt: infoPrompt,
    },
    {
      name: "task",
      prompt: taskPrompt,
    },
  ],
  finalPrompt: fullPrompt,
});

const formattedPrompt = await composedPrompt.format({
  period: "早上",
  name: "张三",
  gender: "male",
  food: "lemon",
});

console.log(formattedPrompt);

// %% [markdown]
// The kernel 'Deno' died.
