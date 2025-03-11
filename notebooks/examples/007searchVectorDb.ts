import path from "path";
import { OllamaEmbeddings } from "@langchain/ollama";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { PROJECT_ROOT } from "@/config";

async function run() {
  const directory = path.join(PROJECT_ROOT, "/db/kongyiji");
  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorstore = await FaissStore.load(directory, embeddings);
  const retriever = vectorstore.asRetriever(2);
  const res = await retriever.invoke("茴香豆是做什么用的");

  console.log({ res });
}

run();
