import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import {
  RunnableSequence,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatDeepSeek } from "@langchain/deepseek";
import { z } from "zod";
import mbtiInfo from "../data/mbtiInfo.json";
import readline from "readline";
import { ChatMessageHistory } from "langchain/memory";
import {
  AgentExecutor,
  createOpenAIToolsAgent,
} from "langchain/agents";
import * as dotenv from "dotenv";

async function getAgent() {
  const prompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是一个共情能力非常强的心理医生，并且很了解MBTI（迈尔斯-布里格斯性格类型指标)的各种人格类型，你的任务是根据来访者的 MBTI 和问题，给出针对性的情感支持，你的回答要富有感情、有深度和充足的情感支持，引导来访者乐观积极面对问题",
    ],
    [
      "human",
      "用户的 MBTI 类型是{type}, 这个类型的特点是{info}, 他的问题是{question}",
    ],
  ]);

  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });
  const mbtiChain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ]);
  const mbtiList: any = Object.keys(mbtiInfo);
  const mbtiTool = new DynamicStructuredTool({
    name: "get-mbti-chat",
    schema: z.object({
      type: z.enum(mbtiList as any).describe("用户的 MBTI 类型"),
      question: z.string().describe("用户的问题"),
    }),
    func: async ({ type, question }: { type: any; question: string }) => {
      const info = mbtiInfo[type as keyof typeof mbtiInfo];
      const res = await mbtiChain.invoke({ type, question, info });
      return res;
    },
    description: "根据用户的问题和 MBTI 类型，回答用户的问题",
  });

  const tools = [mbtiTool];

  const agentPrompt = await ChatPromptTemplate.fromMessages([
    [
      "system",
      "你是一个用户接待的 agent，通过自然语言询问用户的 MBTI 类型和问题，直到你有足够的信息调用 get-mbti-chat 来回答用户的问题",
    ],
    new MessagesPlaceholder("history_message"),
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
  ]);

  const llm = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 0.4,
  });
  const agent = await createOpenAIToolsAgent({
    llm,
    tools,
    prompt: agentPrompt,
  });

  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });
  const messageHistory = new ChatMessageHistory();
  const agentWithChatHistory = new RunnableWithMessageHistory({
    runnable: agentExecutor,
    getMessageHistory: () => messageHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history_message",
  });
  return agentWithChatHistory;
}
async function run() {
  const agentWithChatHistory = await getAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function chat() {
    rl.question("User: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        rl.close();
        return;
      }

      const response = await agentWithChatHistory.invoke(
        {
          input,
        },
        {
          configurable: {
            sessionId: "no-used",
          },
        }
      );

      console.log("Agent: ", (response as any).output);
      // 检查是否已经调用了 get-mbti-chat 工具
      const toolCalled = (response as any).intermediateSteps?.some(
        (step: any) => step.action?.tool === "get-mbti-chat"
      );

      if (toolCalled) {
        console.log("已完成 MBTI 分析，聊天结束。");
        rl.close();
        return;
      }
      chat();
    });
  }
  chat();
}
dotenv.config();
run();
