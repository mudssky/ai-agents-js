import { PROJECT_ROOT } from "@/config";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { DynamicTool, DynamicStructuredTool } from "@langchain/core/tools";
import { OllamaEmbeddings } from "@langchain/ollama";
import path from "path";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { z } from "zod";
import { Calculator } from "@langchain/community/tools/calculator";
import { AgentExecutor, createReactAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import * as dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";

async function loadVectorStore() {
  const directory = path.join(PROJECT_ROOT, "db/threeBody");
  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorStore = await FaissStore.load(directory, embeddings);

  return vectorStore;
}

async function getRetrievalChain() {
  const prompt =
    ChatPromptTemplate.fromTemplate(`将以下问题仅基于提供的上下文进行回答：
    上下文：
    {context}

    问题：{input}`);
  const llm = new ChatDeepSeek({
    model: "deepseek-chat",
  });

  const documentChain = await createStuffDocumentsChain({
    llm,
    prompt,
  });

  const vectorStore = await loadVectorStore();
  const retriever = vectorStore.asRetriever();

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });

  return retrievalChain;
}

async function run() {
  const stringReverseTool = new DynamicTool({
    name: "string-reverser",
    description:
      "reverses a string. input should be the string you want to reverse.",
    func: async (input: string) => input.split("").reverse().join(""),
  });

  const retrieverChain = await getRetrievalChain();
  const retrieverTool = new DynamicTool({
    name: "get-threeBody-answer",
    func: async (input: string) => {
      const res = await retrieverChain.invoke({ input });
      return res.answer;
    },
    description: "获取小说 《三体》相关问题的答案",
    // returnDirect设置为true后，可以直接采用tools返回值，不会再经过一次reAct的流程
    // returnDirect: true,
  });
  const dateDiffTool = new DynamicStructuredTool({
    name: "date-difference-calculator",
    description: "计算两个日期之间的天数差",
    schema: z.object({
      start_date: z.string().describe("第一个日期，以YYYY-MM-DD格式表示"),
      end_date: z.string().describe("第二个日期，以YYYY-MM-DD格式表示"),
    }),
    func: async ({ start_date, end_date }) => {
      const d1 = new Date(start_date);
      const d2 = new Date(end_date);
      const difference = Math.abs(d2.getTime() - d1.getTime());
      const days = Math.ceil(difference / (1000 * 60 * 60 * 24));
      return days.toString();
    },
  });
  const tools = [retrieverTool, new Calculator(), dateDiffTool];
  const prompt = await pull<PromptTemplate>("hwchase17/react");
  const llm = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 0,
  });
  //   const llm = new ChatAlibabaTongyi({
  //     model: "qwen-max-latest",
  //     temperature: 0,
  //   });
  const agent = await createReactAgent({
    llm,
    tools,
    prompt,
  });
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  const res = await agentExecutor.invoke({
    // input: "三体中自然选择号前进四的情节",
    // input: "我有 17 个苹果，小明的苹果比我的三倍少 10 个，小明有多少个苹果？",
    // deepseek chat v3 似乎不支持复杂输入，dateDiffTool用不了
    // qwen-max 2025-01-27 直接得到答案了，没有按照要求返回
    input: "今年是 2025 年，今年 5.1 和 10.1 之间有多少天？",
  });
  console.log({ res });
}
dotenv.config();
run();
