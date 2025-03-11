import path from "path";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { ChatDeepSeek } from "@langchain/deepseek";
import dotenv from "dotenv";
import { PROJECT_ROOT } from "@/config";
async function run() {
  const directory = path.join(PROJECT_ROOT, "db/kongyiji");
  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorstore = await FaissStore.load(directory, embeddings);
  const model = new ChatDeepSeek({
    model: "deepseek-chat",
  });
  const retriever = MultiQueryRetriever.fromLLM({
    llm: model,
    retriever: vectorstore.asRetriever(3),
    queryCount: 3,
    verbose: true,
  });
  const res = await retriever.invoke("茴香豆是做什么用的");

  console.log({ res });
}
dotenv.config({ path: path.join(__dirname, "../.env") });
run();

// 首先，MultiQueryRetriever 会用 LLM 生成三个 query，其中 prompt 是
// You are an AI language model assistant. Your task isto generate 3 different versions of the given user
// question to retrieve relevant documents from a vector database.
// By generating multiple perspectives on the user question,
// your goal is to help the user overcome some of the limitations
// of distance-based similarity search.
// Provide these alternative questions separated by newlines between XML tags. For example:

// <questions>
// Question 1
// Question 2
// Question 3
// </questions>

// Original question: 茴香豆是做什么用的

// 其中核心的 prompt 是告诉 llm 去从检索算法（distance-based similarity search）的角度去生成用户提问的三个角度。

// 输出的结果是
// '
// [
//   "茴香豆的应用或用途是什么？",
//   "茴香豆通常被用来做什么？",
//   "可以用茴香豆来制作什么？"
// ]

// 因为用户的原始输入是 茴香豆是做什么用的，这是一个非常模糊和有歧义性的问题，作为写这个问题的用户，他可能了解想要的答案是 “茴香豆是下酒用的”，但因为自然语言的特点，这是有歧义的的。 MultiQueryRetriever 的意义就是，找出这句话所有可能的意义，然后用这些可能的意义去检索，避免因为歧义导致检索错误。

// 然后，MultiQueryRetriever 会 对每一个 query 调用 vector store 的 retriever，也就是，按照我们上面的参数，会生成 3 * 3 共九个文档结果。 然后咱其中去重，并返回。
