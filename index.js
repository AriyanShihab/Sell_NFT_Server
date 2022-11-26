const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// midleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.f57powx.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  console.log(req.headers);
  const token = req.headers.auth_token;
  console.log(token);
  if (!token) {
    res.status(401).send({
      message: " vai please stop doing this, tumi token dao nai kan?",
    });
  }

  const splitedToken = token.split(" ")[1];

  jwt.verify(splitedToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      res.status(403).send({
        message: "vai tumi token diso, kintu somehow token ta valid na",
      });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const productCollection = client
      .db("selNFT")
      .collection("productCollection");
    const usersCollection = client.db("selNFT").collection("users");
    const bookingCollection = client.db("selNFT").collection("booking");

    // get top products
    app.get("/products/top", async (req, res) => {
      const coursor = await productCollection.find({}).limit(6).toArray();
      res.send(coursor);
    });
    // get a single product

    app.get("/product/:id", async (req, res) => {
      const productID = req.params.id;
      const filter = {
        _id: ObjectId(productID),
      };
      const product = await productCollection.findOne(filter);
      res.send(product);
    });

    // get only categories
    app.get("/only-categories", async (req, res) => {
      const allProduct = await productCollection.find({}).toArray();
      const categories = [];
      allProduct.forEach((product) => {
        if (!categories.includes(product.category)) {
          categories.push(product.category);
        }
      });
      res.send(categories);
    });
    // get advertised product

    app.get("/advertised", async (req, res) => {
      const query = {
        advertised: true,
      };
      const products = await productCollection.find(query).toArray();
      res.send(products);
    });

    // get category specific product
    app.get("/categories/:cat", async (req, res) => {
      const category = req.params.cat;
      const query = {
        category: category,
      };
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // post an user

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = {
        email: email,
      };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "10d",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
    // get user role

    app.get("/userRole", async (req, res) => {
      const userEmail = req.query.email;
      const query = {
        email: userEmail,
      };

      const user = await usersCollection.findOne(query);

      res.send(user);
    });

    // get user specific product

    app.get("/my-products", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const filter = {
        sellerEmail: email,
      };
      const products = await productCollection.find(filter).toArray();
      res.send(products);
    });

    // make an product advertised
    app.put("/makeAdvertised/:id", async (req, res) => {
      const productId = req.params.id;
      const filter = {
        _id: ObjectId(productId),
      };
      const updateDock = {
        $set: { advertised: true },
      };

      const options = {
        upsert: true,
      };

      const result = await productCollection.updateOne(
        filter,
        updateDock,
        options
      );
      console.log(result);
      res.send(result);
    });

    app.delete("/delete-product/:id", async (req, res) => {
      const productId = req.params.id;
      const query = {
        _id: ObjectId(productId),
      };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/add-products", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // post an booking

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);

      res.send(result);
    });

    // get user specific booking

    app.get("/my-orders/:email", async (req, res) => {
      const buyerEmailParams = req.params.email;
      const filter = {
        buyerEmail: buyerEmailParams,
      };
      const product = await bookingCollection.find(filter).toArray();
      console.log(buyerEmailParams, product);
      res.send(product);
    });
    // make a product reported
    app.patch("/add-report/:id", async (req, res) => {
      const productId = req.params.id;
      const filter = {
        _id: ObjectId(productId),
      };
      const updateDock = {
        $set: {
          reported: true,
        },
      };

      const result = await productCollection.updateOne(filter, updateDock);
      res.send(result);
    });

    // get reported products

    app.get("/getReported", async (req, res) => {
      const filter = {
        reported: true,
      };

      const result = await productCollection.find(filter).toArray();

      res.send(result);
    });

    app.delete("/deleteReportedProduct/:id", async (req, res) => {
      const productId = req.params.id;
      const query = {
        _id: ObjectId(productId),
      };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/all-seller", async (req, res) => {
      const filter = {
        role: "seller",
      };
      const allSeller = await usersCollection.find(filter).toArray();

      res.send(allSeller);
    });
    app.get("/all-buyer", async (req, res) => {
      const filter = {
        role: "buyer",
      };
      const allBuyer = await usersCollection.find(filter).toArray();

      res.send(allBuyer);
    });

    app.patch("/verifySeller/:email", async (req, res) => {
      const userEmail = req.params.email;
      const filter = {
        email: userEmail,
      };
      const updatedDoc = {
        $set: { isVerified: true },
      };
      const verifyed = await usersCollection.updateOne(filter, updatedDoc);

      // update there product data as well
      const filterForProducdt = {
        sellerEmail: userEmail,
      };

      const productUpdateDoc = {
        $set: {
          sellerverified: true,
        },
      };

      const products = await productCollection.updateMany(
        filterForProducdt,
        productUpdateDoc
      );

      res.send({ verifyed, products });
    });

    app.patch("/verifyBuyer/:email", async (req, res) => {
      const userEmail = req.params.email;
      const filter = {
        email: userEmail,
      };
      const updatedDoc = {
        $set: { isVerified: true },
      };
      const verifyed = await usersCollection.updateOne(filter, updatedDoc);

      res.send(verifyed);
    });

    app.delete("/delete-user/:email", async (req, res) => {
      const userEmail = req.params.email;
      const filter = {
        email: userEmail,
      };

      const deletedUser = await usersCollection.deleteOne(filter);

      res.send(deletedUser);
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
