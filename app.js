const express = require('express');
const app = express();
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', function(req, res){
    res.render('index');
});

app.get('/profile', isLoggedIn, function(req, res){
    console.log(req.user);

})

app.get('/login', function(req, res){
    res.render('login');
});

app.post('/register', async function(req, res){
    let { email, username, name, age, password } = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered");
    
    bcrypt.genSalt(10, function(err, salt){
        bcrypt.hash(password, salt, async function(err, hash){
            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: user._id }, 'shhhhh');
            res.cookie("token", token);
            res.send("User Registered Successfully")
        })
    })
});

app.post('/login', async function(req, res){
    let { email, password } = req.body;
    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, function(err, result){
        if(result) {
            let token = jwt.sign({ email: email, userid: user._id }, 'shhhhh');
            res.cookie("token", token);
            res.status(200).send("You can login");
        }
        else res.redirect('/login');
    })
});

app.get('/logout', function(req, res){
    res.cookie("token", "");
    res.redirect('/login');
});

function isLoggedIn(req, res, next){
    if(req.cookies.token === "") res.send("You must be logged in");
    else{
        let data = jwt.verify(req.cookies.token, "shhhhh");
        req.user = data;
        next();
    }
}

app.listen(3000);