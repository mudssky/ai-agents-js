// -*- coding: utf-8 -*-
// ---
// jupyter:
//   jupytext:
//     text_representation:
//       extension: .ts
//       format_name: percent
//       format_version: '1.3'
//       jupytext_version: 1.18.1
// ---

// %% [markdown]
// 1. 加载数据
// 2. 切分数据
// 3. 嵌入（embeding），有一种算法是将切片转化为向量，存储到向量数据库中，之后用于检索
// 4. 检索数据，通过向量间相似度的计算
// 5. 增强prompt，让ai的回答范围限制在知识库的内容，比如
//
// ```
// 你是一个 xxx 的聊天机器人，你的任务是根据给定的文档回答用户问题，并且回答时仅根据给定的文档，尽可能回答
// 用户问题。如果你不知道，你可以回答“我不知道”。  
// 这是文档:{docs}  
// 用户的提问是:{question}
// ```
//
// 6. 生成

// %% [markdown]
//
