const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId, serialize } = require('mongodb');
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
app.use(cookieParser());

//Verify jwt middleware
//const verifyToken = (req, res, next) => {
//    const token = req.cookies?.token;
//    if(!token) return res.status(401).send({ message: 'unauthorized access' });
//     if (token) {
//      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//           if (err) {
//           console.log(err);
//           return res.status(401).send({ message: 'unauthorized access' });
//            }
//            console.log(decoded);
//            req.user = decoded;
//            next();
//        } )
//      }
//}


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

    const organizerCollection = client.db('promiseFlow').collection('organizers');
    const VolunteerCollection = client.db('promiseFlow').collection('volunteers');

    //jwt generate
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
        .send({ success: true })
    })

    //Clear token on logout
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0
        })
        .send({ success: true })
    })


    //Get all oraganizers data from db
    app.get('/organizers', async (req, res) => {
      const result = await organizerCollection.find().sort({ deadline: 1 }).toArray();
      res.send(result);
    })


    //Get a single organizer post from db
    app.get('/organizer/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await organizerCollection.findOne(query);
      res.send(result);
    })

    //Save a volunteer data in db
    app.post('/volunteer', async (req, res) => {
      const volunteerData = req.body;

      const query = {
        email: volunteerData.email,
        volunteerId: volunteerData.volunteerId,
      }

      const alreadyRequest = await VolunteerCollection.findOne(query);

      if (alreadyRequest) {
        return res
          .status(400)
          .send('You have already send request on volunteer')

      }
     

      const result = await VolunteerCollection.insertOne(volunteerData);
      res.send(result);
    })


    //Save a oraganizer data in db
    app.post('/organizer', async (req, res) => {
      const organizerData = req.body;
      const result = await organizerCollection.insertOne(organizerData);
      res.send(result);
    })

    //Get all organizers data from db by a specific user
    app.get('/organizers/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'owner.email': email };
      const result = await organizerCollection.find(query).toArray();
      res.send(result);
    })

    //Delete a organizer data from db
    app.delete('/organizer/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await organizerCollection.deleteOne(query);
      res.send(result);
    })

    //Update a organizer post in db 
    app.put('/organizer/:id', async (req, res) => {
      const id = req.params.id;
      const organizerData = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          ...organizerData,
        },
      }
      const result = await organizerCollection.updateOne(query, updateDoc, options);
      res.send(result);
    })

    //Get all volunteers request from db for oraganizer
    app.get('/volunteer-requsets/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'owner.email': email };
      const result = await VolunteerCollection.find(query).toArray();
      console.log(result)
      res.send(result);
    })

    //Delete a volunteer request data from db
    app.delete('/volunteer/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await VolunteerCollection.deleteOne(query);
      res.send(result);
    })

    //Get all oraganizers data from db for implement search
    app.get('/all-organizers', async (req, res) => {
      const search = req.query.search || '';
      let query = {
        postTitle: { $regex: search, $options: 'i' },
      }
      const result = await organizerCollection.find(query).sort({ deadline: 1 }).toArray();
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