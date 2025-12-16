import { ChatDeepSeek } from "@langchain/deepseek";
import { BufferMemory } from "langchain/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

const chatModel = new ChatDeepSeek({
  model: "deepseek-chat",
  verbose: true,
});
const memory = new BufferMemory();

const TEMPLATE = `
你是一个乐于助人的 ai 助手。尽你所能回答所有问题。

这是跟人类沟通的聊天历史:
{history}

据此回答人类的问题:
{input}
`;
const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);

let tempInput = "";

const chain = RunnableSequence.from([
  {
    input: new RunnablePassthrough(),
    memoryObject: async (input) => {
      const history = await memory.loadMemoryVariables({
        input,
      });
      tempInput = input;
      return history;
    },
  },
  RunnablePassthrough.assign({
    history: (input) => input.memoryObject.history,
  }),
  prompt,
  chatModel,
  new StringOutputParser(),
  new RunnablePassthrough({
    func: async (output: any) => {
      await memory.saveContext(
        {
          input: tempInput,
        },
        {
          output,
        },
      );
    },
  }),
]);
