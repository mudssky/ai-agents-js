// -*- coding: utf-8 -*-
// ---
// jupyter:
//   jupytext:
//     text_representation:
//       extension: .ts
//       format_name: percent
//       format_version: '1.3'
//       jupytext_version: 1.18.1
//   kernelspec:
//     display_name: Deno
//     language: typescript
//     name: deno
// ---

// %%
import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
const loader = new TextLoader("data/kong.txt");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 100,
  chunkOverlap: 20,
});

const splitDocs = await splitter.splitDocuments(docs);
splitDocs;

// %%
//deno-ignore-cell
import { OpenAIEmbeddings } from "@langchain/openai";
const embeddings = new OpenAIEmbeddings();
console.log(splitDocs[0]);
// Document {
//   pageContent: "鲁镇的酒店的格局，是和别处不同的：都是当街一个曲尺形的大柜台，柜里面预备着热水，可以随时温酒。做工的人，傍午傍晚散了工，每每花四文铜钱，买一碗酒，——这是二十多年前的事，现在每碗要涨到十文，——靠柜外",
//   metadata: { source: "data/kong.txt", loc: { lines: { from: 1, to: 1 } } }
// }

// %% [markdown]
// bge-large和bge-m3都是智谱开源的embeding模型\
// large是中文专用模型，适合纯中文场景，并且模型1.3B较大，资源消耗高\
// m3是多语言模型，资源消耗更低

// %%
import { OllamaEmbeddings } from "npm:@langchain/ollama";
const embeddings = new OllamaEmbeddings({
  model: "bge-m3",
  baseUrl: "http://localhost:11434", // Default value
});
const res = await embeddings.embedQuery(splitDocs[0].pageContent);
res;

// %% [markdown]
// ## 创建 MemoryVectorStore
//
// 这是在内存中构建的向量数据库\
// 注意，因为 embedding 向量是需要有一定的花费的，所以仅在学习和测试时使用
// MemoryVectorStore，而在真实项目中，搭建其他向量数据库，或者使用云数据库。

// %%
import { MemoryVectorStore } from "langchain/vectorstores/memory";

const vectorstore = new MemoryVectorStore(embeddings);
await vectorstore.addDocuments(splitDocs);


// %%
// 创建一个 retriever，这也是可以直接从 vector store 的实例中自动生成，这里我们传入了参数 2，代表对应每个输入，我们想要返回相似度最高的两个文本内容
const retriever = vectorstore.asRetriever(2);
// 然后，我们就可以使用 retriever 来进行文档的提取
await retriever.invoke("茴香豆是做什么用的");
// 可以看到结果提取出茴香豆相关的内容

// %%
await retriever.invoke("下酒菜一般是什么？");
// 提取的时候，是根据相似度进行度量的，所以如果用户提问的特别简洁，并没有相应的关键词，就会出现提取的信息错误的问题，
// 下面没有截取到孔乙己下酒物相关的（温两碗酒，要一碟茴香豆）分块

// %%
// 如果涉及多层语意的情况，也会有问题，有运气的成分，所以返回更多的数据源就会有价值
await retriever.invoke("孔乙己用什么谋生？");

// %% [markdown]
// ## 构建本地vector store
//
// 这里我们使用faiss，这是facebook开源的，node和python都可以使用
//
// 也可以使用HNSWLib
//
// 另外faiss-node，使用pnpm直接安装，langchain里面会报导入错误。。。
//
// Faiss是轻量级库，适合小规模数据（百万级以下） python中可以用Milvus（十亿级）
//
// 选型决策树 根据需求快速匹配最合适的工具：
//
// 1. 开发阶段验证或小型项目 → ChromaDB（简单、无依赖）。
// 2. 生产环境且需全托管服务 → Pinecone（省心）或 Zilliz Cloud（超大规模）。
// 3. 已有 PostgreSQL 数据库 → PGVector + pgvector（无需引入新组件）。
// 4. 需要极致性能的本地实验 → FAISS（内存索引，无需网络延迟）。
// 5. 企业级海量数据+复杂查询 → Milvus（自建）或 Weaviate（混合搜索）。
