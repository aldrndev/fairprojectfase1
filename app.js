const express = require('express');
const router = require('./routers');
const app = express();
const port = 3000;
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/views'));

app.use(
  session({
    secret: 'G5zD!7gF&3f^%E1@H#p8j*', // Anda harus mengganti ini dengan string acak yang kompleks
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set menjadi true jika Anda menggunakan HTTPS
  })
);

app.use(router);

app.listen(port, () => {
  console.log(`i love you ${port}`);
});
