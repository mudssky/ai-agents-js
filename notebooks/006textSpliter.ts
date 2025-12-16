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

// %% [markdown]
// 而从宏观角度来看 TextSplitter 他的工作方式非常的好理解
//
// 1. 首先是根据预设的分块逻辑，将内容切分成多个块，并且每个块是表达独立的语意。对于一般文本，你可以理解成切分到句子这一级，因为切分到词已经失去了语意性。
// 2. 开始将这些块进行组装，一直到用户预设的块大小限制。
// 3. 在组装完一个块后，会根据相同的逻辑去组装另一个块。并且在组装时，会根据用户设定的块之间的重叠大小，来给文档块添加与上下文档块的重叠部分。
//    例如第一个块是 AABBCC,那么第二个块就是 CCDDEE，第三个块就是 EEFFGG。

// %% [markdown]
// 下面是一些langchain提供的切分工具
//
// | 名称      | 说明                                              |
// | --------- | ------------------------------------------------- |
// | Recursive | 根据给定的切分字符（例如 \n\n、\n等），递归的切分 |
// | HTML      | 根据 html 特定字符进行切分                        |
// | Markdown  | 根据 md 的特定字符进行切分                        |
// | Code      | 根据不同编程语言的特定字符进行切分                |
// | Token     | 根据文本块的 token 数据进行切分                   |
// | Character | 根据用户给定的字符进行切割                        |

// %%
// RecursiveCharacterTextSplitter
// 这是最常用的切分工具
// 默认的分隔符列表是 ["\n\n", "\n", " ", ""]
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { TextLoader } from "langchain/document_loaders/fs/text";

const loader = new TextLoader("data/kong.txt");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 64,
  chunkOverlap: 16,
});

const splitDocs = await splitter.splitDocuments(docs);
splitDocs;

// %%
// 支持切分的语言
import { SupportedTextSplitterLanguages } from "langchain/text_splitter";

console.log(SupportedTextSplitterLanguages);

// %%
// 对 js 的分割本质上就是将 js 中常见的切分代码的特定字符传给 RecursiveCharacterTextSplitter，然后还是根据 Recursive 的逻辑进行切分，跟对正常 text 切分的逻辑是一样的。
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const js = `
function myFunction(name,job){
	console.log("Welcome " + name + ", the " + job);
}

myFunction('Harry Potter','Wizard')

function forFunction(){
	for (let i=0; i<5; i++){
        console.log("这个数字是" + i)
	}
}

forFunction()
`;

const splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
  chunkSize: 64,
  chunkOverlap: 0,
});
const jsOutput = await splitter.createDocuments([js]);
jsOutput;

// %%
// Token
import { TokenTextSplitter } from "langchain/text_splitter";

const text =
  "I stand before you today the representative of a family in grief, in a country in mourning before a world in shock.";

const splitter = new TokenTextSplitter({
  chunkSize: 10,
  chunkOverlap: 0,
});

const docs = await splitter.createDocuments([text]);
docs;

// %%
