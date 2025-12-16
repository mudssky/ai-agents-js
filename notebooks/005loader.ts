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
// Doucment对象是对所有数据类型的一个统一抽象
// interface Document {
//   pageContent: string;
//   metadata: Record<string, any>;
// }
import { Document } from "@langchain/core/documents";
const test = new Document({
  pageContent: "test text",
  metadata: { source: "ABC Title" },
});
test;

// %%
// TextLoader

import { TextLoader } from "langchain/document_loaders/fs/text";
const loader = new TextLoader("data/test.txt");

const docs = await loader.load();
docs;

// %%
// 加载pdf文件
import pdfParse from "npm:pdf-parse";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
const loader = new PDFLoader("data/caddy.pdf");
const pdfs = await loader.load();
pdfs;

// %%
// DirectoryLoader,批处理目录下的文件
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";

const loader = new DirectoryLoader(
  "./data",
  {
    ".pdf": (path) => new PDFLoader(path, { splitPages: false }),
    ".txt": (path) => new TextLoader(path),
  },
);
const docs = await loader.load();
docs;

// %%
// Web Loader
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import ignore from "npm:ignore";
const loader = new GithubRepoLoader(
  "https://github.com/mudssky/ai-agents-js",
  {
    branch: "main",
    recursive: false,
    unknown: "warn",
    ignorePaths: ["*.md", "yarn.lock", "*.json"],
    // accessToken: env["GITHUB_TOKEN"]
  },
);
await loader.load();

// %%
// CheerioWebBaseLoader
import "npm:cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
const loader = new CheerioWebBaseLoader(
  "https://kaiyi.cool/blog/github-copilot",
);

const docs = await loader.load();

// %%
docs[0].pageContent;

// %%
// SearchApiLoader
// 网络搜索api，有一定免费额度。。。

import { SerpAPILoader } from "langchain/document_loaders/web/serpapi";

const apiKey = env["SERP_KEY"];
const question = "什么 github copliot";
const loader = new SerpAPILoader({ q: question, apiKey });
const docs = await loader.load();
