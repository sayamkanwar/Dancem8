var express = require("express");
const fileUpload = require("express-fileupload");
var app = express();
const http = require("http");
var server = http.createServer(app);
const path = require("path");

app.use(fileUpload());
app.use("/static", express.static(path.join(__dirname, "public")));

app.post("/upload", function(req, res) {
	if (!req.files || Object.keys(req.files).length === 0) {
		return res.status(400).send("No files were uploaded.");
	}

	// The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
	let sampleFile = req.files.userStepImg;

	// Use the mv() method to place the file somewhere on your server
	sampleFile.mv("./userStepImgs/image01.jpg", function(err) {
		if (err) return res.status(500).send(err);

		// res.send("File uploaded!");
		res.redirect("http://localhost:1234/upload.html");
	});
});

// app.get("/analysis", function(req, res) {
// 	res.sendFile(path.join(__dirname + "/analysis.html"));
// });

const port = process.env.PORT || 3000;
console.log("Server started at localhost:" + port);
server.listen(port);
