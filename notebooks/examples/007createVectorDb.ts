import { OllamaEmbeddings } from "@langchain/ollama";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import path from "path";
import "faiss-node";

const run = async () => {
  const loader = new TextLoader(
    path.join(__dirname, "../notebooks/data/kong.txt")
  );
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

  const directory = path.join(__dirname, "../db/kongyiji");
  await vectorStore.save(directory);
};

run();
