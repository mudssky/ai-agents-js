import express from "express";
import { getRagChain } from "./013rag-enhance";

const app = express();
const port = 22080;

app.use(express.json());

app.post("/", async (req: any, res: any) => {
  const ragChain = await getRagChain();
  const body = req.body;
  const result = await ragChain.stream(
    {
      question: body.question,
    },
    { configurable: { sessionId: body.session_id } }
  );

  res.set("Content-Type", "text/plain");
  for await (const chunk of result) {
    res.write(chunk);
  }
  res.end();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
