const decoder = new TextDecoder("utf-8");

fetch("http://localhost:8000").then(async res => {
  const reader = res.body!.getReader();

  while (true) {
    const { done, value } = await reader.read();

    console.log(decoder.decode(value));

    if (done) {
      break;
    }
  }
});
