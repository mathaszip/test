import express from 'express';
const router = express.Router();
import connectDB from './db.js';
import UserProfile from './models/userInfo.js';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';


import { checkSession, generateSessionToken } from './myFunctions/index.js';


const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  router.post('/importUser', async (req, res) => {
    try {
      const db = await connectDB();
      const users = db.collection('users');
      // Check if email or username already exists            
      const existingUser = await users.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });
      if (existingUser) {
        res.json({ error: 'Username or email already exists' }); // Error message
      } else {
        const userProfile = new UserProfile({ // Requesting the information from the form
          username: req.body.username,
          password: crypto.createHash('sha256').update(req.body.password).digest('hex'), // Requests the password from the frontend and encrypts it using the security standard AES256-bit encryption method.
          email: req.body.email,
          birthday: req.body.birthday,
        });
  
        const newUser = await users.insertOne(userProfile); // Insert the data into the database
        res.json({ success: true });
      }
    } catch (error) {
      console.log("Error importing user:", error);
      res.json({ error: 'Unknown error' });
    }
  });

  router.post('/login', async (req, res) => {
    try {
        const db = await connectDB();
        const userDetails = {
            username: req.body.username,
            password: crypto.createHash('sha256').update(req.body.password).digest('hex'),
        }
        const user = await db.collection('users').findOne({ username: userDetails.username, password: userDetails.password });
        if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
        } else {
            // Create a session for the user
            const sessionToken = generateSessionToken();
            const sessionExpiration = new Date(Date.now() + SESSION_DURATION)
            await db.collection('sessions').insertOne({ sessionToken, userId: user._id, expires: sessionExpiration }) ;
            // Set a cookie with the session token and redirect the user to the dashboard
            res.cookie('session', sessionToken, { expires: sessionExpiration, httpOnly: true});
            res.json({ success: true });
        }
    } catch (error) {
        console.log("Error logging in:", error);
        res.json({ error: 'Unknown error' });
      }
});

router.get('/session', checkSession, async (req, res) => {
  try {
    const db = await connectDB();
    const userId = new ObjectId(req.session.userId); // Convert string to ObjectId
    console.log('Request from session:', req.session.username);
    const user = await db.collection('users').findOne({ _id: userId });
    res.json(user);
  } catch (error) {
    console.log('Error retrieving user session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
  
router.get('/API/protectedRoute', checkSession, (req, res) => {
  // If the user is authenticated, return a success message
  res.send('You are authenticated!');
});

async function getShoppinglist(req) {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne(
      { _id: req.session.userId },
      { projection: { shoppingList: 1 } }
    );
    if (user && user.shoppingList) {
      return user.shoppingList;
    } else {
      return [];
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}



router.post("/API/shoppingList/addNewItem", checkSession, async (req, res) => {
  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ _id: req.session.userId });

    const newItem = {
      id: uuidv4(),
      name: req.body.name,
      price: req.body.price,
      bought: false
    };
    

    await db.collection('users').updateOne(
      { _id: user._id },
      { $push: { shoppingList: newItem } }
    );

    console.log(user.items[0].name);

  } catch (error) {

  } finally {
    res.send('Item added to shopping list');
  }
});

router.get("/API/shoppingList/getList", checkSession, async (req, res) => {
  try {
    const list = await getShoppinglist(req);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(list));
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

router.post("/API/shoppingList/checkItem/:id", checkSession, async (req, res) => {
  try {
    const db = await connectDB();
    const item = await db.collection('users').findOne({ _id: req.session.userId, "shoppingList.id": req.params.id });
    if (!item) {
      return res.status(404).send('Item not found in shopping list');
    }
    const currentBoughtValue = item.shoppingList.find(item => item.id === req.params.id).bought;
    const newBoughtValue = !currentBoughtValue;
    const result = await db.collection('users').updateOne(
      { _id: req.session.userId, "shoppingList.id": req.params.id },
      { $set: { "shoppingList.$.bought": newBoughtValue } }
    );
    if (result.modifiedCount === 1) {
      res.send('Item was updated: ' + req.params.id);
    } else {
      res.status(404).send('Item not found in shopping list');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
})










router.delete("/API/shoppingList/deleteItem/:id", checkSession, async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('users').updateOne(
      { _id: req.session.userId },
      { $pull: { shoppingList: { id: req.params.id } } }
    );
    console.log(result); // add this line to check the result of the updateOne operation
    if (result.modifiedCount === 1) {
      res.send('Item removed from shopping list: ' + req.params.id);
    } else {
      res.status(404).send('Item not found in shopping list');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});




router.get("/API/shoppingList/getProductPrices", async (req, res) => {
  const { query } = req.query;

  const response = await fetch(`https://api.sallinggroup.com/v1-beta/product-suggestions/relevant-products?query=${query}`, {
    headers: {
      "Authorization": "Bearer 3dac909e-0081-464f-aeac-f9a2efe5cf1a",
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });

  const data = await response.json();

// Check if the response is empty
if (!data || !data.suggestions || data.suggestions.length === 0) {
  res.json({ suggestions: [{title: undefined, price: 0}] });
  return;
}

  res.json(data);
});

  

export default router;