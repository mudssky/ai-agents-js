import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Ollama, OllamaEmbeddings } from "@langchain/ollama";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import fs from "fs";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatDeepSeek } from "@langchain/deepseek";

//拼接上下文到一起
const convertDocsToString = (documents: any[]): string => {
  return documents.map((document) => document.pageContent).join("\n");
};
async function run() {
  process.env.LANGCHAIN_VERBOSE = "true";

  //   1. 构建 vector store 和 retriever
  const loader = new TextLoader(
    path.join(__dirname, "../notebooks/data/threeBody.txt")
  );
  const docs = await loader.load();
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });

  const directory = path.join(__dirname, "../db/threeBody");
  let vectorstore;

  // 分批处理的大小
  const batchSize = 10;

  if (!fs.existsSync(directory)) {
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
  //   const res = await retriever.invoke(
  //     "文中黑暗森林的理论是谁提出的？详细介绍黑暗森林的理论"
  //   );
  //   console.log({ res });

  const contextRetriverChain = RunnableSequence.from([
    (input) => input.question,
    retriever,
    convertDocsToString,
  ]);
  const res = await contextRetriverChain.invoke({
    question: "文中黑暗森林的理论是谁提出的？详细介绍黑暗森林的理论",
  });
  console.log({ res });

  //   2. 构建template

  const TEMPLATE = `
你是一个熟读刘慈欣的《三体》的终极原著党，精通根据作品原文详细解释和回答问题，你在回答时会引用作品原文。
并且回答时仅根据原文，尽可能回答用户问题，如果原文中没有相关内容，你可以回答“原文中没有相关内容”，

以下是原文中跟用户回答相关的内容：
{context}

现在，你需要基于原文，回答以下问题：
{question}`;
  const prompt = ChatPromptTemplate.fromTemplate(TEMPLATE);
  // const model = new Ollama({
  //   model: "deepseek-r1:7b",
  //   temperature: 0.6,
  //   maxRetries: 2,
  //   // other params...
  // });
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });
  const ragChain = RunnableSequence.from([
    {
      context: contextRetriverChain,
      question: (input) => input.question,
    },
    prompt,
    model,
    new StringOutputParser(),
  ]);
  //   await ragChain.invoke({
  //     question: "文中黑暗森林的理论是谁提出的？详细介绍黑暗森林的理论",
  //   });
  const stream = await ragChain.stream({
    // question: "文中黑暗森林的理论是谁提出的？详细介绍黑暗森林的理论",
    question: "谁是地球三体组织的领袖",
  });
  process.stdout.write("回答: ");
  for await (const chunk of stream) {
    process.stdout.write(chunk);
  }
  process.stdout.write("\n");
}

run();
