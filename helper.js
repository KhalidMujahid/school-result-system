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

function getPositionSuffix(position) {
  if (position % 10 === 1 && position !== 11) {
    return `${position}st`;
  } else if (position % 10 === 2 && position !== 12) {
    return `${position}nd`;
  } else if (position % 10 === 3 && position !== 13) {
    return `${position}rd`;
  } else {
    return `${position}th`;
  }
}

module.exports = {
  serveFile,
  getPositionSuffix,
}
