require('dotenv').config()
const mongoose = require('mongoose')

const db_url = process.env.MONGODB_URL.toString()


mongoose.connect( db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch((error) => {
    console.log(error)
})



