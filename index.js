const express = require("express");
const app = express();
const mongoose = require("mongoose");
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const cloudinary = require("cloudinary").v2;

mongoose.connect("mongodb://127.0.0.1:27017/vinted");

cloudinary.config({
  cloud_name: "dhtlqg150",
  api_key: "277995154599981",
  api_secret: "Utl17XWUUB3rEoMIZwlGoqelIMQ",
});

app.use(express.json());
app.use(userRoutes);
app.use(offerRoutes);

app.all("*", (req, res) => {
  res.status(404).json({ message: "Page not found" });
});

app.listen(3000, () => {
  console.log("Server has started");
});
