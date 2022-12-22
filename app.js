//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyparser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport=require('passport');
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate= require('mongoose-findorcreate')
const app = express();

//level 4
//const bcrypt = require('bcrypt');
//const saltRounds = 10;
//level 3
//const md5 = require('md5')
//level 2
/*const encrypt=require('mongoose-encryption')*/
//console.log(process.env.API_KEY);

app.use(bodyparser.urlencoded({extended:true}))
app.use(express.static('public'))
app.set('view engine','ejs')
app.use(session({
    secret:'our little secret.',
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB')

const userSchema =new mongoose.Schema ({
    email:String,
    password:String,
    googleId:String,
    secret:String
})
userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model('User',userSchema);

passport.use(User.createStrategy());
/*passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());*/
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID:    process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/login',(req,res)=>{
    res.render('login')
})
app.get('/register',(req,res)=>{
    res.render('register')
})
app.get('/submit',(req,res)=>{
    if(req.isAuthenticated){
        res.render('submit')
    }else{res.redirect('/login')} 
})
app.post('/submit',(req,res)=>{
    const submitedsecret = req.body.secret;
    console.log(req.user.id);
    User.findById(req.user.id,(err,results)=>{
        if(err){console.log(err);}
        else{if(results){
       results.secret=submitedsecret
       results.save(()=>{
        res.redirect('/secrets')
       })
        
        }}
    })
})
app.get('/secrets',(req,res)=>{
   User.find({secret:{$ne:null}},(err,results)=>{
    if(err){console.log(err);}
    else{if(results){
        res.render('secrets',{secrets:results})
    }}
   })
})
app.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if(err){console.log(err);}
        else{res.redirect('/')}
    });

})
app.get('/auth/google',
  passport.authenticate('google', { scope:
      ["email", "profile" ] }
));
app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));
//level 2
/*const secret = process.env.SECRET
userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']})*/


app.post('/register',(req,res)=>{
   
   User.register({username:req.body.username},req.body.password,(err,user)=>{
    if(err){
        console.log(err);
        res.redirect('/register')
    }else{passport.authenticate('local')(req,res,()=>{
        res.redirect('/secrets')
    })}
   })
   
   
   
   
   
    /* bcrypt.hash(req.body.password,saltRounds,(err,hash)=> {
        const newuser = new User({
            email:req.body.username,
            password:hash
        })
        newuser.save((err)=>{
            if(err){console.log(err);}
            else(res.render('secrets'))
        })
    });*/
    
})
app.post('/login',(req,res)=>{
   const user = new User({
    username:req.body.username,
    password:req.body.password
   })
   req.login(user,(err)=>{
    if(err){console.log(err);}
    else{
        passport.authenticate('local')(req,res,()=>{
            res.redirect('secrets')
        }
            )
    }
   })
    
    
    
    
    
    
    
    /*User.findOne({email:username},(err,results)=>{
        if(err){console.log(err);}
        else{
            if(results){
                bcrypt.compare(password, results.password, (err, result)=> {
                    if(result == true){
                        res.render('secrets')
                        console.log('matched');
                      
                    }
                });
       
    }
    }
    })*/
})


app.listen(3000,()=>{
    console.log('on port 3000');
})