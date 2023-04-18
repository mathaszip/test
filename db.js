import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://mathiasml:azGuKi4D6JJAV3GK@cluster0.wwxqiqn.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("test");
    return db;
  } catch (error) {
    console.log("Error connecting to MongoDB:", error);
  }
}

export default connectDB;