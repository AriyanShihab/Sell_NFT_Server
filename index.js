const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// midleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f57powx.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const productCollection = client
      .db("selNFT")
      .collection("productCollection");
    app.get("/products", async (req, res) => {
      const coursor = await productCollection.find({}).toArray();
      res.send(coursor);
    });
    app.get("/categories", async (req, res) => {
      const allProduct = await productCollection.find({}).toArray();
      const categories = [];
      allProduct.forEach((product) => {
        if (!categories.includes(product.category)) {
          categories.push(product.category);
        }
      });
      res.send(categories);
    });
  } catch {}
}
run().catch((err) => {
  console.log(err);
});

app.get("/", (req, res) => {
  res.send({ wel: "Hello From Server Of NFT" });
});
app.listen(port, () => {
  console.log("server running on port 5000");
});
