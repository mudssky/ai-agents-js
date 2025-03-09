import path from "path";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from "dotenv";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
async function run() {
  const directory = path.join(__dirname, "../db/kongyiji");
  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorstore = await FaissStore.load(directory, embeddings);
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });
  const retriever = ScoreThresholdRetriever.fromVectorStore(vectorstore, {
    minSimilarityScore: 0.4,
    maxK: 5,
    kIncrement: 1,
  });
  const res = await retriever.invoke("茴香豆是做什么用的");

  console.log({ res });
}
dotenv.config({ path: path.join(__dirname, "../.env") });
run();

// minSimilarityScore， 定义了最小的相似度阈值，也就是文档向量和 query 向量相似度达到多少，我们就认为是可以被返回的。这个要根据你的文档类型设置，一般是 0.8 左右，可以避免返回大量的文档导致消耗过多的 token 。
// maxK，一次最多返回多少条数据，这个主要是为了避免返回太多的文档造成 token 过度的消耗。
// kIncrement，定义了算法的布厂，你可以理解成 for 循环中的 i+k 中的 k。其逻辑是每次多获取 kIncrement 个文档，然后看这 kIncrement 个文档的相似度是否满足要求，满足则返回。
