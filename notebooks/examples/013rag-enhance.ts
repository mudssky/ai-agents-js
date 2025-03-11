import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import {
  RunnablePassthrough,
  RunnableSequence,
  RunnableWithMessageHistory,
} from "@langchain/core/runnables";
import { ChatDeepSeek } from "@langchain/deepseek";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import fs from "fs";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { JSONChatHistory } from "./013JSONChatHistory";
import { PROJECT_ROOT } from "@/config";

export async function getRagChain() {
  // 优化用户的对话
  // Human: 这个故事的主角是谁？
  // AI: 主角是小明
  // Human: 介绍他的故事

  const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。",
    ],
    new MessagesPlaceholder("history"),
    ["human", "将以下问题重述为一个独立的问题：\n{question}"],
  ]);

  const rephraseChain = RunnableSequence.from([
    rephraseChainPrompt,
    new ChatDeepSeek({
      model: "deepseek-chat",
      temperature: 0.2,
    }),
    new StringOutputParser(),
  ]);

  //   const historyMessages = [
  //     new HumanMessage("你好，我叫小明"),
  //     new AIMessage("你好小明"),
  //   ];
  //   const question = "你觉得我的名字怎么样？";
  //   const standaloneQuestion = await rephraseChain.invoke({
  //     history: historyMessages,
  //     question,
  //   });
  //   console.log(standaloneQuestion);

  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const directory = path.join(PROJECT_ROOT, "db/threeBody");
  let vectorstore;
  // 分批处理的大小
  const batchSize = 10;
  if (!fs.existsSync(directory)) {
    //   1. 构建 vector store 和 retriever
    const loader = new TextLoader(
      path.join(PROJECT_ROOT, "notebooks/data/threeBody.txt")
    );
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    const splitDocs = await splitter.splitDocuments(docs);
    // 创建初始向量存储，使用第一批文档
    const firstBatch = splitDocs.slice(0, batchSize);
    vectorstore = await FaissStore.fromDocuments(firstBatch, embeddings);

    // 分批处理剩余文档
    for (let i = batchSize; i < splitDocs.length; i += batchSize) {
      const batch = splitDocs.slice(i, i + batchSize);
      console.log(
        `处理批次 ${i / batchSize + 1}，文档处理进度: ${i}/${splitDocs.length}`
      );
      await vectorstore.addDocuments(batch);
    }

    // 保存向量存储
    await vectorstore.save(directory);
  } else {
    vectorstore = await FaissStore.load(directory, embeddings);
  }
  const retriever = vectorstore.asRetriever(7);
  const convertDocsToString = (documents: any[]): string => {
    return documents.map((document) => document.pageContent).join("\n");
  };
  const contextRetrieverChain = RunnableSequence.from([
    (input) => input.standalone_question,
    retriever,
    convertDocsToString,
  ]);
  const TEMPLATE = `
你是一个熟读刘慈欣的《三体》的终极原著党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

以下是原文中跟用户回答相关的内容：
{context}

现在，你需要基于原文，回答以下问题：
{question}`;
  const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });
  const ragChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      standalone_question: rephraseChain,
    }),
    RunnablePassthrough.assign({
      context: contextRetrieverChain,
    }),
    prompt,
    model,
    new StringOutputParser(),
  ]);
  const chatHistoryDir = path.join(__dirname, "chatHistory");
  if (!fs.existsSync(chatHistoryDir)) {
    fs.mkdirSync(chatHistoryDir);
  }
  const ragChainWithHistory = new RunnableWithMessageHistory({
    runnable: ragChain,
    getMessageHistory: (sessionId) =>
      new JSONChatHistory({ sessionId, dir: chatHistoryDir }),
    historyMessagesKey: "history",
    inputMessagesKey: "question",
  });
  return ragChainWithHistory;
}

async function run() {
  const ragChainWithHistory = await getRagChain();
  const stream = await ragChainWithHistory.stream(
    {
      // question: "文中黑暗森林的理论是谁提出的？详细介绍黑暗森林的理论",
      question: "谁是地球三体组织的领袖",
    },
    {
      configurable: { sessionId: "test-history" },
    }
  );
  process.stdout.write("回答: ");
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");
}
// run();
