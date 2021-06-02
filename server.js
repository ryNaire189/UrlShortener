const express = require('express')
const mongoose = require('mongoose')
const ShortUrl = require('./models/shortUrl')
const app = express()
var validUrl = require('valid-url')
const bodyParser = require('body-parser')
const jsonParser = bodyParser.json();
const dotenv = require('dotenv')

dotenv.config()
const user = process.env.DB_USER
const pass = process.env.DB_PASS
const endpoint = process.env.DB_ENDPOINT

//initialise connection to DB
const url = `mongodb+srv://${user}:${pass}@${endpoint}`;
mongoose.set( 'useUnifiedTopology', true );
mongoose.set( 'useNewUrlParser', true )
mongoose.connect( url )
const db = mongoose.connection

db.on( 'error', console.error.bind( console, 'connection error:' ) );
db.once( 'open', _ => console.log( 'Database connected:', url ) )

app.set('view engine','ejs')
app.use(express.urlencoded({extended:false}))

app.get('/', async (req, res)=>{
    const shortUrl = await ShortUrl.find()
    res.render('index',{ shortUrl: shortUrl})
})

//create URL
app.post('/shortUrl',jsonParser, async (req, res, next)=>{

    let url = JSON.stringify(req.body.fullUrl);
    const inputUrl = JSON.parse(url);

    try{
        if(!validUrl.isUri(inputUrl)){
            res.send("Invalid Link");
            //throw "Invalid Link";
        }
        
        const fullUrl = await ShortUrl.findOne({full: inputUrl});
        if (fullUrl != null) {
            const shortUrl = fullUrl.short;
            res.send("Link already been used: " +shortUrl);
            //throw "Link already been used: " +shortUrl;
        }else{
            await ShortUrl.create({full: inputUrl});
            res.send("New link successfully shortened:");
            res.redirect('/')
            //throw "New link";
        }
            
    } catch(err){
        next(err)
    }
})

//redirect to longURL by passing in shortURL
app.get('/:shortUrl', async (req, res)=>{
    const shortUrl = await ShortUrl.findOne({short: req.params.shortUrl})
    if(shortUrl == null) return res.sendStatus(404)

    shortUrl.clicks++
    shortUrl.save()

    res.redirect(shortUrl.full)
})

app.listen(process.env.PORT || 1000);
