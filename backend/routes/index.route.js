const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  res.type("text");
  res.send("Hello Server World!");
});

module.exports = router;
