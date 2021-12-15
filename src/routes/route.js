const express = require('express');
const router = express.Router();
const urlController = require("../controllers/urlController");


router.post("/url/shorten", urlController.urlShortner);
router.get("/:urlCode",urlController.geturl);




module.exports = router;
