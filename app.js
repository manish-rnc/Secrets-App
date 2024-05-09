import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import bcrypt from "bcrypt";
import md5 from "md5";
import encrypt from "mongoose-encryption";
const saltRounds = 6;

const app = express();
const port = 3000;

// For cookies and sessions
app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
//

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({ email: String, password: String });

// Encryption

// This app.js file may be accessible by others on internet or while collaborating so this( secret ) needs to be kept secure otherwise
// one could easily decrypt the data and in order secure it we need to use environment varibles and put .env file into .gitignore file
// This file should be made at the beginning of the project otherwise VCS may show the previous version containing the secrets.
// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});   // mongoose will automatically encrypt the password field
// In encryption, if one can get the key then it becomes very easy to decrypt the password

//

// For cookies and authentication
userSchema.plugin(passportLocalMongoose);
//

const User = new mongoose.model("User", userSchema);

// For cookies and authentication
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//

app.get("/", (req, res) => {
    res.render("home.ejs");
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/register", (req, res) => {
    res.render("register.ejs");
});

// app.post("/register", (req, res) => {
//     const newUser = new User({
//         email: req.body.username,
//         password: md5(req.body.password)
//     });
//     newUser.save()
//         .then(() => {
//             res.render("secrets.ejs");
//         })
//         .catch((err) => {
//             console.log(err);
//         })
// });
// For bcrypt
// app.post("/register", (req, res) => {
//     bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });
//         newUser.save()
//             .then(() => {
//                 res.render("secrets.ejs");
//             })
//             .catch((err) => {
//                 console.log(err);
//             })
//     })
// });

// app.post("/login", (req, res) => {
//     const username = req.body.username;
//     const password = md5(req.body.password);

//     User.findOne({email: username})
//         .then((foundUser) => {
//             if(foundUser) {
//                 if(foundUser.password === password) {
//                     res.render("secrets.ejs");
//                 }
//                 else {
//                     res.send("<h1> Wrong Password !</h1>");
//                 }
//             }
//         })
//         .catch((err) => {
//             console.log(err);
//         })
// });

// For bcrypt
// app.post("/login", (req, res) => {
//     const username = req.body.username;
//     const password = req.body.password;

//     User.findOne({email: username})
//         .then((foundUser) => {
//             if(foundUser) {
//                 bcrypt.compare(password, foundUser.password, (err, result) => {
//                     if(result) {
//                         res.render("secrets.ejs");
//                     }
//                     else {
//                         res.send("<h1> Wrong Password !</h1>");
//                     }
//                 })
//             }
//         })
//         .catch((err) => {
//             console.log(err);
//         })
// });

// For cookies and sessions
app.get("/secrets", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("secrets.ejs");
    }
    else {
        res.redirect("/login");
    }
});

app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.register({username: username}, password)
        .then(() => {
            const authenticate = passport.authenticate("local");
            authenticate(req, res, () => {
                res.redirect("/secrets");
            })
        })
        .catch((err) => {
            res.redirect("/register");
        });
});

app.post("/login", (req, res) => {
    const newUser = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(newUser, (err) => {
        if(err) {
            console.log(err);
        }
        else {
            passport.authenticate("local")(req, res, ()=> {
                res.redirect("/secrets");
            })
        }
    });
});
//

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/"); 
});

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});