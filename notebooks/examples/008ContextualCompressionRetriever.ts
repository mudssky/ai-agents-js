import { PROJECT_ROOT } from "@/config";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatDeepSeek } from "@langchain/deepseek";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ContextualCompressionRetriever } from "langchain/retrievers/contextual_compression";
import { LLMChainExtractor } from "langchain/retrievers/document_compressors/chain_extract";
import path from "path";

async function run() {
  process.env.LANGCHAIN_VERBOSE = "true";

  const directory = path.join(PROJECT_ROOT, "db/kongyiji");
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });

  const compressor = LLMChainExtractor.fromLLM(model);
  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorstore = await FaissStore.load(directory, embeddings);
  const retriever = new ContextualCompressionRetriever({
    baseCompressor: compressor,
    baseRetriever: vectorstore.asRetriever(2),
  });
  const res = await retriever.invoke("茴香豆是做什么用的");

  console.log({ res });
}

run();

// 这个就是让ai提取核心信息，起到压缩上下文的效果
// Given the following question and context, extract any part of the context *AS IS* that
// is relevant to answer the question. If none of the context is relevant return
// NO_OUTPUT.

// Remember, *DO NOT* edit the extracted parts of the context.

// > Question: 茴香豆是做什么用的
// > Context:
// >>>
// 有喝酒的人便都看着他笑，有的叫道，“孔乙己，你脸上又添上新伤疤了！”他不回答，对柜里说，“温两碗酒，要一碟
// 茴香豆。”便排出九文大钱。他们又故意的高声嚷道，“你一定又偷了人家的东西了！”孔乙己睁大眼睛说
// >>>
// Extracted relevant parts:
