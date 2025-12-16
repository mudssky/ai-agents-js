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
  new HumanMessage("讲个笑话"),
]);

// %%
// StringOutputParser 提取api返回的文本数据
import { StringOutputParser } from "@langchain/core/output_parsers";

const parser = new StringOutputParser();

const chain = model.pipe(parser);

await chain.invoke([
  new HumanMessage("讲个笑话"),
]);

// %%
// 部分 Parser 会内置一些预先设计好的 prompt 对模型进行引导
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";

const parser = StructuredOutputParser.fromNamesAndDescriptions({
  answer: "用户问题的答案",
  evidence: "你回答用户问题所依据的答案",
  confidence: "问题答案的可信度评分，格式是百分数",
});

// %%
console.log(parser.getFormatInstructions());
// 先告诉 LLM 输出的类型
// 然后，使用 few-shot （一种 prompt 技巧），也就是用示例告诉 LLM 什么是 JSON Schema，什么情况会被解析成功，什么情况不会被解析成功
// 然后，再次强调类型的重要性，输出必须遵循给定的JSON Schema实例，确保所有字段严格匹配Schema中的定义，没有额外的属性，也没有遗漏的必需属性。
// 并强调需要注意细节，比如不要在JSON对象中添加多余的逗号，这可能会导致解析失败。
// 这些 prompt 质量非常高，把在该任务中大模型容易出现的问题都进行了强调，可以有效的保证输出的质量。
// 最后才是给出，我们指定的 JSON 格式和对应的描述

// %%
const prompt = PromptTemplate.fromTemplate(
  "尽可能的回答用的问题 \n{instructions} \n{question}",
);
// const model = new ChatDeekSeek();

const chain = prompt.pipe(model).pipe(parser);
const res = await chain.invoke({
  question: "蒙娜丽莎的作者是谁？是什么时候绘制的",
  instructions: parser.getFormatInstructions(),
});

console.log(res);

// %%
// List Output Parser,限制列表格式得到指令
import { CommaSeparatedListOutputParser } from "@langchain/core/output_parsers";

const parser = new CommaSeparatedListOutputParser();

console.log(parser.getFormatInstructions());

// %%
// const model = new ChatOpenAI();
const prompt = PromptTemplate.fromTemplate(
  "列出3个 {country} 的著名的互联网公司.\n{instructions}",
);

const chain = prompt.pipe(model).pipe(parser);

const response = await chain.invoke({
  country: "America",
  instructions: parser.getFormatInstructions(),
});

// %%
response;

// %%
// Auto Fix Parser ，对于部分对输出质量要求更高的场景，如果出现了输出不符合要求的情况，我们希望的不是让 LLM 反复输出（可能每次都是错的），因为 LLM 并没有意识到自己的错误。所以我们需要把报错的信息返回给 LLM，让他理解错在哪里，应该怎么修改。

import { z } from "zod";
const schema = z.object({
  answer: z.string().describe("用户问题的答案"),
  confidence: z.number().min(0).max(100).describe(
    "问题答案的可信度评分，满分 100",
  ),
});
const parser = StructuredOutputParser.fromZodSchema(schema);
const prompt = PromptTemplate.fromTemplate(
  "尽可能的回答用的问题 \n{instructions} \n{question}",
);
// const model = new ChatOpenAI();

const chain = prompt.pipe(model).pipe(parser);
const res = await chain.invoke({
  question: "蒙娜丽莎的作者是谁？是什么时候绘制的",
  instructions: parser.getFormatInstructions(),
});

console.log(res);

// %%
// fixParse只是一个纯粹的json更合适处理，可以修复json格式的问题。
import { OutputFixingParser } from "langchain/output_parsers";
// 我们构造一个错误的输出，
const wrongOutput = {
  "answer":
    "蒙娜丽莎的作者是达芬奇，大约在16世纪初期（1503年至1506年之间）开始绘制。",
  "sources": "90%",
};
console.log({ OutputFixingParser });

const fixParser = OutputFixingParser.fromLLM(model, parser);
const output = await fixParser.parse(JSON.stringify(wrongOutput));
output;

// %% [markdown]
// 出于节约成本考虑，可以实现gpt4的错误输出，用3.5来修复，可以节约成本
