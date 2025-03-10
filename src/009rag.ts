import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";
import fs from "fs";

async function run() {
  process.env.LANGCHAIN_VERBOSE = "true";
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

  const retriever = vectorstore.asRetriever(2);
  const res = retriever.invoke("文中黑暗森林的理论是谁提出的？");
  console.log({ res });
}

run();
