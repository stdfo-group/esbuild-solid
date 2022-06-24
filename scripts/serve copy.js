require("esbuild")
  .serve(
    {
      servedir: "www",
      port: 8000,
      host: "localhost"
    },
    {
      entryPoints: ["www/index.js"],
      outdir: "www",
      bundle: true,
      loader: {
        ".png": "dataurl",
        ".jpg": "file",
      },
    }
  )
  .then((_server) => {
      console.log("Server is running at: http://localhost:8000/")
    // server.stop();
  });