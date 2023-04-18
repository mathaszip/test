import express from 'express';
const app = express();
import router from './routes.js';
import connectDB from './db.js';
import cookieParser from 'cookie-parser';

// Parse cookies from incoming requests
app.use(cookieParser());

app.use(express.static("public"));
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', router);

connectDB().then(() => {
  app.listen(app.get('port'), function () {
    console.log('app listening at: ' + "http://localhost:" + app.get('port') + "/");
    console.log("Connected to MongoDB!");
  });
}).catch((error) => {
  console.log("Error connecting to MongoDB:", error);
});