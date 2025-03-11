const port = 22080;

async function fetchStream() {
  const response = await fetch(`http://localhost:${port}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      question: "三体组织的船在哪里被拦截",
      session_id: "test-server",
    }),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      process.stdout.write("\n");
      break;
    }
    // console.log(decoder.decode(value));
    const textStr = decoder.decode(value);
    process.stdout.write(textStr);
  }

  console.log("Stream has ended");
}

fetchStream();
