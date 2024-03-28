const express = require("express");
require("dotenv").config();
const app = express();

app.get("/", (req, res) => {
	res.send("Hello World!");
});

app.get("/linkedin", (req, res) => {
	res.send("https://www.linkedin.com/suvayan1992");
});

app.listen(process.env.PORT, () => {
	console.log(`Example app listening on port ${process.env.PORT}`);
});
