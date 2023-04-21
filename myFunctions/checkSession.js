import connectDB from './../db.js';

async function checkSession(req, res, next) {
  const sessionToken = req.cookies.session;
  if (!sessionToken) {
  return res.status(401).send('Unauthorized');
  }
  
  const db = await connectDB();
  const session = await db.collection('sessions').findOne({ sessionToken, expires: { $gt: new Date() } });
  if (!session) {
  res.clearCookie('session');
  return res.status(401).send('Unauthorized');
  }
  
  const user = await db.collection('users').findOne({ _id: session.userId });
  if (!user) {
  res.clearCookie('session');
  return res.status(401).send('Unauthorized');
  }
  
  req.session = {
  userId: user._id,
  username: user.username,
  email: user.email
  };
  
  next();
  }
  
  

export default checkSession;