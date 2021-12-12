const urlModel = require("../models/urlModel");
//uniqueId generator
const shortId = require("shortid");
var validUrl = require("valid-url");

//validation checking function
const isValid = function (value) {
  if (typeof value === "undefined" || value === null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
const isValidRequestBody = function (requestBody) {
  return Object.keys(requestBody).length > 0;
};

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

      if (
        !/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(
          longUrl
        )
      ) {
        return res
          .status(400)
          .send({ status: false, message: `This is not a valid Url` });
      }

      if (
        (longUrl.includes("https://") &&
          longUrl.match(/https:\/\//g).length !== 1) ||
        (longUrl.includes("http://") &&
          longUrl.match(/http:\/\//g).length !== 1) ||
        (longUrl.includes("ftp://") && longUrl.match(/ftp:\/\//g).length !== 1)
      ) {
        return res.status(400).send({ status: false, msg: "Url is not valid" });
      }

      if (!/(.com|.org|.co.in|.in|.co|.us)/.test(longUrl)) {
        return res.send("Url is not valid");
      }

      if (
        longUrl.includes("w") &&
        (longUrl.indexOf("w") === 6 ||
          longUrl.indexOf("w") === 7 ||
          longUrl.indexOf("w") === 8)
      ) {
        let arr = [];
        let i = longUrl.indexOf("w");
        while (longUrl[i] == "w") {
          if (longUrl[i] === "w") {
            arr.push(longUrl[i]);
          }
          i++;
        }

        if (!(arr.length === 3)) {
          return res
            .status(400)
            .send({ status: false, msg: "Url is not valid " });
        }
      }

      if (!validUrl.isUri(longUrl)) {
        return res
          .status(400)
          .send({
            status: false,
            messege:
              "The Url Is Not A Valid Url Please Provide The correct Url",
          });
      }

      //we have to find using long url here
      let find = await urlModel
        .findOne({ longUrl: longUrl })
        .select({ createdAt: 0, updatedAt: 0 });
      if (find) {
        return res.status(200).send({ status: true, data: find });
      } else {
        let generate = shortId.generate();
        let uniqueId = generate.toLowerCase();

        //checking if the code already exists
        let used = await urlModel.findOne({ urlCode: uniqueId });
        if (used) {
          return res
            .status(400)
            .send({
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

//GET /:urlCode

const geturl = async function (req, res) {
  try {
    let urlCode = req.params.urlCode;
    if (!isValid(urlCode)) {
      return res
        .status(400)
        .send({ status: false, messege: "Please Use A Valid Link" });
    } else {
      let findUrl = await urlModel.findOne({ urlCode: urlCode });
      if (!findUrl) {
        return res
          .status(400)
          .send({
            status: false,
            messege: "Cant Find What You Are Looking For",
          });
      }
      let fullUrl = findUrl.longUrl;
      // return res.status(200).send({status:true,Link:fullUrl});
      return res.status(302).redirect(fullUrl);
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
