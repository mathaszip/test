import connectDB from './../db.js';

async function checkSession(req, res, next) {
    const sessionToken = req.cookies.session;
    if (!sessionToken) {
      return res.redirect('/login');
    }
  
    const db = await connectDB();
    const session = await db.collection('sessions').findOne({ sessionToken, expires: { $gt: new Date() } });
    if (!session) {
      res.clearCookie('session');
      return res.redirect('/login');
    }
  
    const user = await db.collection('users').findOne({ _id: session.userId });
    if (!user) {
      res.clearCookie('session');
      return res.redirect('/login');
    }
  
    req.session = {
      userId: user._id,
      username: user.username,
      email: user.email
    };
  
    next();
  }
  
  

export default checkSession;