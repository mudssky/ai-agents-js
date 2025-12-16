import { Calculator } from "@langchain/community/tools/calculator";
// import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { pull } from "langchain/hub";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatDeepSeek } from "@langchain/deepseek";
import { createReactAgent, AgentExecutor } from "langchain/agents";
import * as dotenv from "dotenv";
async function run() {
  const tools = [/* new TavilySearchResults(), */ new Calculator()];
  const prompt = await pull<PromptTemplate>("hwchase17/react");
  const llm = new ChatDeepSeek({
    model: "deepseek-chat",
    temperature: 0,
  });
  const agent = await createReactAgent({
    llm,
    tools,
    prompt,
  });
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });
  const result = await agentExecutor.invoke({
    input: "我有 17 美元，现在相当于多少人民币？",
  });
  console.log({ result });
}

dotenv.config();
run();
