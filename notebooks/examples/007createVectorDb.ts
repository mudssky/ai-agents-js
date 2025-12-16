import { OllamaEmbeddings } from "@langchain/ollama";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import path from "path";
import "faiss-node";
import { PROJECT_ROOT } from "@/config";

const run = async () => {
  const loader = new TextLoader(`${PROJECT_ROOT}/notebooks/data/kong.txt`);
  const docs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });
  const splitDocs = await splitter.splitDocuments(docs);

  const embeddings = new OllamaEmbeddings({
    model: "bge-m3",
    baseUrl: "http://localhost:11434", // Default value
  });
  const vectorStore = await FaissStore.fromDocuments(splitDocs, embeddings);

  const directory = path.join(PROJECT_ROOT, "/db/kongyiji");
  await vectorStore.save(directory);
};

run();
