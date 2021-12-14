const urlModel = require("../models/urlModel");

const shortId = require("shortid");
var validUrl = require("valid-url");
const redis = require("redis");

const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient(
  14741,
  "redis-14741.c266.us-east-1-3.ec2.cloud.redislabs.com",
  { no_ready_check: true }
);
redisClient.auth("0UzWGtehIzQmuT07qqsnz1Apio6XXQEW", function (err) {
  if (err) throw err;
});

redisClient.on("connect", async function () {
  console.log("Connected to Redis server..");
});

//1. connect to the server
//2. use the commands :

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//********check validation***************/

const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
const isValidRequestBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};

// *********post api create short url*************//

//POST /url/shorten

const urlShortner = async function (req, res) {
  try {
    const data = req.body;
    if (!isValidRequestBody(data)) {
      return res
        .status(400)
        .send({ status: false, messege: "Please Provide The Required Field" });
    } else {
      var longUrl = req.body.longUrl;
      if (!longUrl) {
        return res
          .status(400)
          .send({ status: false, messege: "Please Provide The LongUrl" });
      }

      if (!isValid(longUrl)) {
        return res
          .status(400)
          .send({ status: false, messege: "Please Provide The LongUrl" });
      }
      var longUrl = longUrl.trim();
let i =/(:?^((https|http|HTTP|HTTPS){1}:\/\/)(([w]{3})[\.]{1})?([a-zA-Z0-9]{1,}[\.])[\w]*((\/){1}([\w@?^=%&amp;~+#-_.]+))*)$/;
       if (!i.test(longUrl)){
            return res.status(400).send({ status: false, message: `This is not a valid Url` })
          }
    
          

      if (!validUrl.isUri(longUrl)) {
        return res.status(400).send({
          status: false,
          messege: "The Url Is Not A Valid Url Please Provide The correct Url",
        });
      }
let cacheData = await GET_ASYNC(`${req.body.longUrl}`);
if (cacheData) {
  let x = JSON.parse(cacheData);
  return res.status(302).send({ status: true, data: x });
}
      let find = await urlModel
        .findOne({ longUrl: longUrl })
        .select({ createdAt: 0, updatedAt: 0, __v: 0, _id: 0});
      if (find) {
        await SET_ASYNC(`${req.body.longUrl}`, JSON.stringify(find));
        return res.status(200).send({ status: true, data: find });
      } else {
        let generate = shortId.generate();
        let uniqueId = generate.toLowerCase();

        let used = await urlModel.findOne({ urlCode: uniqueId });
        if (used) {
          return res.status(400).send({
            status: false,
            messege: "It seems You Have To Hit The Api Again",
          });
        }

        let baseurl = "http://localhost:3000";
        let shortLink = baseurl + `/` + uniqueId;

        //saving data in database
        data["urlCode"] = uniqueId;
        data["shortUrl"] = shortLink;
        let savedData = await urlModel.create(data);
        return res.status(201).send({
          status: true,
          message: "Data saved Successfully",
          data: savedData,
        });
      }
    }
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//********** get api for redirect url code**************

const geturl = async function (req, res) {
  try {
    let urlCode = await GET_ASYNC(`${req.params.urlCode}`);
    if (urlCode) {
      let data = JSON.parse(urlCode);
      res.status(200).redirect(data.longUrl);
      //  console.log(urlCode)
    } else {
      let findUrl = await urlModel.findOne({ urlCode: req.params.urlCode });
      if (findUrl) {
        await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(findUrl));
        res.status(200).redirect(findUrl.longUrl);
        console.log(findUrl);
      } else {
        res
          .status(400)
          .send({
            status: false,
            messege: "Cant Find What You Are Looking For",
          });
      }
    }
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

module.exports.urlShortner = urlShortner;
module.exports.geturl = geturl;
