const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// DB_USER=doctorPortal
// DB_PASS=A5PBYALDM1bEfuRc

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hldsi1b.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctorPortal").collection("services");

    const bookingCollection = client.db("doctorPortal").collection("bookings");

    /** Services api is started here  **/
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/available", async (req, res) => {
      const date = req.query.date;

      // step-1: find all services
      const services = await serviceCollection.find().toArray();

      // step-2: get the booking of that day
      const query = { date: date };
      const bookings = await bookingCollection.find(query).toArray();

      // step-3: for each service
      services.forEach((service) => {
        // step 4: find bookings for that service. output [{}, {}, {}, {}]
        const serviceBookings = bookings.filter(
          (b) => b.treatment === service.name
        );
        // step 5: selects slots fot the service bookings: ['', '','','']
        const bookedSlots = serviceBookings.map((b) => b.slot);
        // step 6: select those slots that are not in bookedSlots
        const available = service.slots.filter((s) => !bookedSlots.includes(s));
        // step 7: set available to slots to make it easier
        service.slots = available;
      });

      res.send(services);
    });

    /* Booking api is started here */

    app.get("/bookings", async (req, res) => {
      const patient = req.query.patient;
      const query = { patient: patient };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const query = {
        treatment: booking.treatment,
        date: booking.date,
        patient: booking.patient,
      };
      const exists = await bookingCollection.findOne(query);
      if (exists) {
        return res.send({ success: false, booking: exists });
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({ success: true, result });
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
