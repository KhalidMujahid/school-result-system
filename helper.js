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
  const lastDigit = position % 10;
  const lastTwoDigits = position % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${position}th`;
  }
  if (lastDigit === 1) {
    return `${position}st`;
  } else if (lastDigit === 2) {
    return `${position}nd`;
  } else if (lastDigit === 3) {
    return `${position}rd`;
  }

  return `${position}th`;
}


module.exports = {
  serveFile,
  getPositionSuffix,
}
