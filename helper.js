const fs = require("fs");
const path = require("path");

function serveFile(res, filePath, contentType) {
  fs.readFile(path.resolve(filePath), (err, data) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    }
  });
}

module.exports = {
  serveFile,
}
