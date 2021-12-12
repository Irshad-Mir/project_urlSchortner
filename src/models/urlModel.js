const mongoose = require('mongoose');


const urlSchema = new mongoose.Schema({
    urlCode: {type:String , required:true, unique:true , trim:true,lowercase:true }, 
    longUrl: {
             type:String ,
             required:true,
             trim:true,
             validate: {
                validator: function(longUrl) {
                    return /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(longUrl)
                }
               }
             },
    shortUrl: {type:String , required:true, unique:true} 

}, { timestamps: true })

module.exports = mongoose.model('URL', urlSchema)



