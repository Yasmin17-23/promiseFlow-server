const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
    origin: [
       'http://localhost:5173',
       'http://localhost:5174',
       'https://promiseflow-b4ff2.web.app',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hmtao.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
     
    const volunteerCollection = client.db('promiseFlow').collection('volunteer');

    app.get('/volunteers', async(req, res) => {
       const result = await volunteerCollection.find().toArray();
       res.send(result);
    })


    //Get a single volunteer post from db
    app.get('/volunteers/:id', async (req, res) => {
       const id = req.params.id;
       const query = { _id: new ObjectId(id) };
       const result = await volunteerCollection.findOne(query);
       res.send(result);
    })




   //Save a volunteer data in db
   app.post('/volunteer', async (req, res) => {
      const volunteerData = req.body;
      const result = await volunteerCollection.insertOne(volunteerData);
      res.send(result);
   })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello From PromiseFlow all Volunteer..')
})

app.listen(port, () => {
    console.log(`PromiseFlow Server is running on port: ${port}`);
})