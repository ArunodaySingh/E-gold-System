require('dotenv').config()
//connectDB
const connectDB = require("./database/config");
//User Scheme
const user = require("./database/Scheme/user");
//1st plan Scheme
const plan1user = require("./database/Scheme/plan1user");
//2nd plan cheme
const plan2user = require("./database/Scheme/plan2user");
//Authentications
const passport = require("passport");
require("./Authentications/passport")(passport);

const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');


const uuid = require('uuid');
const sessionId = uuid.v4();
const dialogflow = require('@google-cloud/dialogflow');



const moment = require('moment');

const PORT = process.env.PORT;
const flash = require("connect-flash");
const async = require("async");
const nodemailer = require("nodemailer");


const url = require('url');
const ejs = require('ejs');
const fs = require("fs");
var path = require('path');
var multer = require('multer');
//using multer file upload
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads')
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
var upload = multer({
  storage: storage
});
var insta = require('instamojo-nodejs');
const bp = require('body-parser');
const request = require('request');
const {
  stringify
} = require("querystring");
const {
  kStringMaxLength
} = require("buffer");
const {
  setupMaster
} = require("cluster");
app.use(express.static('public'))
app.set("view engine", "ejs")
app.use(flash());
app.use(bp.urlencoded({
  extended: true
}));
app.use(express.json());

//database connection
connectDB();

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', require("./Routes/route"));

app.use('/login', require("./Routes/route"));

app.use('/chooseplan1', require("./Routes/route"));

app.use('/plan3', require("./Routes/route"));

app.use('/register', require("./Routes/route"));

app.use('/admin', require("./Routes/route"));

app.use('/adminlogin', require("./Routes/route"));

app.use('/form/:title', require("./Routes/route"));

app.use('/reset', require("./Routes/route"));

app.use('/1stplan', require("./Routes/route"));

app.use('/kyc', require("./Routes/route"));

app.get('/2ndplan', function (req, res) {
  res.render('2ndscheme');
})

app.get('/3rdplan', function (req, res) {
  res.render('3rdscheme');
})

app.post('/amount', function (req, res) {
  if (req.isAuthenticated()) {
    const amt = parseInt(req.body.a);
    res.render('submit', {
      amt: amt
    });
  } else {
    res.redirect('/login');
  }
})



app.get('/pay', function (req, res) {

  res.render("paymentdetail")
})




app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('202', '/', {
    name: "Login"
  })
})




///password updation



app.get('/reset/:token', function (req, res) {
  user.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  }, function (err, user) {
    if (!user) {
      req.flash('success', 'Password reset token is invalid or has expired.');
      return res.redirect('/reset');
    }
    res.render('forget2', {
      token: req.params.token
    });
  });
});

app.post('/forget/:token', function (req, res) {
  async.waterfall([
    function (done) {
      user.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
          $gt: Date.now()
        }
      }, function (err, user) {
        if (!user) {
          req.flash('success', 'Password reset token is invalid or has expired.');
          return res.redirect('/reset');
        }
        if (req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          })
        } else {
          req.flash("success", "Passwords do not match.");
          return res.redirect('/reset');
        }
      });
    },
    function (user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.USERNAME,
          pass: process.env.PASSWORD
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.USERNAME,
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function (err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function (err) {
    res.redirect('/login');
  });
});

// password updation ends here

// kyc uploading here
var count = 0;
app.post('/fileupload', upload.single("image"), (req, res, next) => {
  var obj = {
    img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png',
      msg: req.user.name + " has uploades a new documents"
    }
  }

  user.updateOne({
    _id: req.user._id
  }, obj, function (err, user) {
    if (err) throw new Error(err);
    req.flash('success', 'File Uploaded Successfully');
    res.redirect(301, '/kyc');
  })
})
//uploading ends here

app.get('/userkyc', (req, res) => {
  user.find({}, (err, items) => {
    if (err) {
      console.log(err);
    } else {
      res.render('newkyc');
    }
  });
});

app.get('/form/:title', function (req, res) {
  const id = req.params.title;
  user.findOne({
    _id: id
  }, function (err, result) {
    res.render("userkyc", {
      item: result
    });
  })
})

app.get('/planchoose', function (req, res) {
  const id = req.user._id;
  user.findOne({
    _id: id
  }, function (err, result) {
    if (err) {
      console.log(err)
    }


    if ((result.kycvalue) == 1) {
      res.render('allplan')
    } else {
      req.flash('success', 'Upload your kyc document or wait for admin approvement');
      res.redirect(301, '/kyc');
    }
  })
})




//kyc approval or rejection
app.post('/approved', (req, res) => {
  const adminmsg = req.body.approvedmessage;
  const uid = req.body.button;
  user.updateOne({
    _id: uid
  }, {
    kycmessage: adminmsg,
    kycvalue: 1
  }, (err, result) => {
    if (err) throw new Error(err);
    req.flash('success', 'kyc is Approved');
    res.redirect(301, '/allkycdetails');
  })
})
app.post('/rejected', (req, res) => {
  const adminmsg = req.body.approvedmessage;
  const uid = req.body.button;
  user.updateOne({
    _id: uid
  }, {
    kycmessage: adminmsg,
    kycvalue: 0
  }, (err, result) => {
    if (err) throw new Error(err);
    req.flash('success', 'kyc is Rejected');
    res.redirect(301, '/allkycdetails');
  })
})

//nomineeupload
app.post('/nomineeupload', (req, res) => {
  const adminmsg = req.body.approvedmessage;
  const uid = req.body.button;
  user.updateOne({
    _id: uid
  }, {
    nommessage: adminmsg,
    nomvalue: 1
  }, (err, result) => {
    if (err) throw new Error(err);
    req.flash('success', 'Nomineee Claim is Approved');
    res.redirect(301, '/allkycdetails');
  })
})

app.post('/disnomineeupload', (req, res) => {
  const adminmsg = req.body.approvedmessage;
  const uid = req.body.button;
  user.updateOne({
    _id: uid
  }, {
    nommessage: adminmsg,
    nomvalue: 0
  }, (err, result) => {
    if (err) throw new Error(err);
    req.flash('success', 'Nomineee Claim is Rejected');
    res.redirect(301, '/allkycdetails');
  })
})

//1st plan implementation
app.post('/pay', function (req, res) {
  const clientID = req.user._id;
  user2.findOne({
    custid: clientID
  }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result) {

        var date1 = new Date(result.c_amount[result.c_amount.length - 1].date);


        const currentdate = moment(new Date(req.body.date)).format("MM/DD/YYYY");

        var date2 = new Date(currentdate);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 31) {

          insta.setKeys(process.env.INSTA_SETKEY_1, process.env.INSTA_SETKEY_2);
          var data = new insta.PaymentData();
          insta.isSandboxMode(true);
          const amt = parseInt(req.body.amount)
          data.purpose = "Test"; // REQUIRED
          data.amount = amt; // REQUIRED
          data.currency = 'INR';
          data.buyer_name = req.body.name;
          data.email = req.body.email;
          data.phone = req.body.number;
          data.send_sms = 'False';
          data.send_email = 'true';
          data.allow_repeated_payments = 'False';
          data.setRedirectUrl(`http://localhost:3000/api?amount=${req.body.amount}`);

          insta.createPayment(data, function (error, response) {
            if (error) {
              console.log(error);
            } else {
              // Payment redirection link at response.payment_request.longurl
              const responsedata = JSON.parse(response);
              const longUrl = responsedata.payment_request.longurl;
              res.redirect(301, longUrl);
            }
          })
        } else {

          const dueamt = Math.floor((diffDays / 30) * 50);
          insta.setKeys(process.env.INSTA_SETKEY_1, process.env.INSTA_SETKEY_2);
          var data = new insta.PaymentData();
          insta.isSandboxMode(true);
          const amt = parseInt(req.body.amount) + dueamt;
          data.purpose = "Test"; // REQUIRED
          data.amount = amt; // REQUIRED
          data.currency = 'INR';
          data.name = req.body.name;
          data.email = req.body.email;
          data.phone = req.body.number;
          data.send_sms = 'False';
          data.send_email = 'true';
          data.allow_repeated_payments = 'False';
          data.setRedirectUrl(`http://localhost:3000/api?amount=${amt}`);

          insta.createPayment(data, function (error, response) {
            if (error) {
              console.log(error);
            } else {
              // Payment redirection link at response.payment_request.longurl
              const responsedata = JSON.parse(response);
              const longUrl = responsedata.payment_request.longurl;
              res.redirect(301, longUrl);
            }
          })
          //  req.flash('success', 'Your due amount is ' + dueamt);
          // res.redirect(301, '/plan1');
        }
      } else {

        insta.setKeys(process.env.INSTA_SETKEY_1, process.env.INSTA_SETKEY_2);
        var data = new insta.PaymentData();
        insta.isSandboxMode(true);
        const amt = parseInt(req.body.amount);
        data.purpose = "Test"; // REQUIRED
        data.amount = amt; // REQUIRED
        data.currency = 'INR';
        data.name = req.body.name;
        data.email = req.body.email;
        data.phone = req.body.number;
        data.send_sms = 'False';
        data.send_email = 'true';
        data.allow_repeated_payments = 'False';
        data.setRedirectUrl(`http://localhost:3000/api?amount=${req.body.amount}`);

        insta.createPayment(data, function (error, response) {
          if (error) {
            console.log(error);
          } else {
            // Payment redirection link at response.payment_request.longurl
            const responsedata = JSON.parse(response);
            const longUrl = responsedata.payment_request.longurl;
            res.redirect(301, longUrl);
          }
        })

      }
    }
  })


});






//// 1st plan registration
app.get('/plan1', function (req, res) {

  res.render('chooseplan', {
    expressFlash: req.flash('success')
  })
})

app.post("/plan1register", function (req, res) {


  const custid = req.user._id;
  const email = req.body.email;
  const name = req.user.name;
  const mobile = req.body.phone;
  const amount = req.body.amount;
  const starting_date = new Date().toLocaleString();

  const emi_amount = amount / 12;

  plan1user.findOne({
    custid: custid
  }, function (err, result) {
    if (err)
      console.log(err)
    else {
      if (result) {

        req.flash('success', 'Already Registered ,U can pay premium ');
        res.redirect('/plan1');


      } else {
        const arr = []
        const newuser = new plan1user({

          custid: custid,
          premium_amount: amount,
          emi_amount: emi_amount,
          name: name,
          phone: mobile,
          registred_date: starting_date,
          email: email,
          c_amount: arr
        })
        newuser.save();


        req.flash('success', 'Congratulations:You Have subscibed the plan Successfully');
        res.redirect('/plan1');



      }


    }


  })


})
//plan1 pay premium
app.get("/plan1emi", function (req, res) {

  res.render("plan1pay", {
    expressFlash: req.flash('success')
  })

})

app.get("/faq", function (req, res) {

  res.render("faq")
})
var chatarr = [];
app.get('/chatbox', (req, res) => {
  console.log(chatarr);
  res.render('chatbox', { data: chatarr });
})


app.post('/chatbox2', (req, res) => {

  const msg = req.body.msg;
  chatarr.push(msg);

  /**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
  async function runSample(projectId = process.env.PROJECT_ID) {
    // A unique identifier for the given session


    // Create a new session
    const sessionClient = new dialogflow.SessionsClient(
      {
        keyFilename: process.env.KEY_FILENAME
      }
    );
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    // The text query request.
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // The query to send to the dialogflow agent
          text: msg,
          // The language used by the client (en-US)
          languageCode: 'en-US',
        },
      },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    chatarr.push(result.fulfillmentText);
    res.redirect('/chatbox');

  }
  runSample();
})

app.post("/paypremium", function (req, res) {
  plan1user.findOne({
    custid: req.user._id
  }, function (err, result) {
    if (err) {
      console.log(err)

    } else {

      if (result) {
        //checking for the late payment fees weekly wise is also have to be done

        insta.setKeys(process.env.INSTA_SETKEY_1, process.env.INSTA_SETKEY_2);
        var data = new insta.PaymentData();
        insta.isSandboxMode(true);

        const amt = parseInt(req.body.amount);



        const test = "payment of emi ";

        data.purpose = test; // REQUIRED
        data.amount = amt; // REQUIRED
        data.currency = 'INR';
        data.name = req.body.name;
        data.email = req.body.email;
        data.phone = req.body.number;
        data.send_sms = 'False';
        data.send_email = 'False';
        data.allow_repeated_payments = 'False';
        data.setRedirectUrl(`http://localhost:3000/plan1api?amount=${amt}`);

        insta.createPayment(data, function (error, response) {
          if (error) {
            console.log(error);

          } else {
            // Payment redirection link at response.payment_request.longurl
            const responsedata = JSON.parse(response);
            const longUrl = responsedata.payment_request.longurl;
            res.redirect(301, longUrl);
          }
        })
      } else {
        req.flash('success', 'Kindly First Register the plan');
        res.redirect('/plan1emi');
      }
    }
  })
})


app.get('/plan1api', function (req, res) {
  let url_parts = url.parse(req.url, true);
  const responsedata = url_parts.query;
  if (responsedata.payment_id) {
    const clientID = req.user._id;
    plan1user.findOne({
      custid: clientID
    }, function (err, result) {
      if (err)
        console.log(err)
      else {
        const currentdate = moment(new Date()).format("MM/DD/YYYY");
        const currenttime = new Date().toLocaleTimeString();

        var arr = {
          date: currentdate,
          paid_amt: responsedata.amount,
          time: currenttime
        };
        result.c_amount.push(arr);
        result.save();


        res.redirect('/')


      }
    });

  }
});

//plan1 ends here


// 2nd plan implementation
app.get("/plan2register", function (req, res) {

  res.render("2ndplanregister", {
    expressFlash: req.flash('success')
  });
});

//1st time registration
app.post('/register2', function (req, res) {

  const custid = req.user._id;
  const email = req.body.email;
  const name = req.body.name;
  const mobile = req.body.mobile;
  const starting_date = new Date().toLocaleString();


  plan2user.findOne({
    custid: custid
  }, function (err, result) {
    if (err)
      console.log(err)
    else {
      if (result) {

        req.flash('success', 'Already Registered ,U can Buy ');
        res.redirect('/plan2register');


      } else {
        const arr = [];

        const newuser = new plan2user({

          custid: custid,
          name: name,
          phone: mobile,
          registred_date: starting_date,
          email: email,
          c_amount: arr
        })
        newuser.save();
        req.flash('success', 'Congratulations:You Have subscibed the plan Successfully');
        res.redirect('/plan2register');



      }


    }


  })
});

//goldbuy
app.get('/plan2buy', (req, res) => {
  var options = {
    'method': 'GET',
    'url': 'https://www.goldapi.io/api/XAU/INR',
    'headers': {
      'x-access-token': process.env.X - ACCESS - TOKEN,
      'Content-Type': 'application/json'
    }
  };
  request(options, function (error, response) {
    if (error) throw new Error(error);
    const convert = JSON.parse(JSON.stringify(response.body))
    const convert2 = JSON.parse(convert);

    res.render("2ndplan", {
      data: convert2,
      expressFlash: req.flash('success')
    })
  });
})

app.post("/goldbuy", function (req, res) {
  const custid = req.user._id;
  plan2user.findOne({
    custid: custid
  }, function (err, result) {
    if (err) {
      console.log(err)

    } else {

      if (result) {


        insta.setKeys(process.env.INSTA_SETKEY_1, process.env.INSTA_SETKEY_2);
        var data = new insta.PaymentData();
        insta.isSandboxMode(true);

        const amt = parseInt(req.body.price);

        const gold = req.body.quantity;
        const arr = [gold, amt];
        const test = "quantity of gold Bought :" + gold;

        data.purpose = test; // REQUIRED
        data.amount = amt; // REQUIRED
        data.currency = 'INR';
        data.name = req.body.name;
        data.email = req.body.email;
        data.phone = req.body.number;
        data.send_sms = 'False';
        data.send_email = 'False';
        data.allow_repeated_payments = 'False';
        data.setRedirectUrl(`http://localhost:3000/plan2api?amount=${arr}`);

        insta.createPayment(data, function (error, response) {
          if (error) {
            console.log(error);
          } else {
            // Payment redirection link at response.payment_request.longurl
            const responsedata = JSON.parse(response);
            const longUrl = responsedata.payment_request.longurl;
            res.redirect(301, longUrl);
          }
        })
      } else {
        req.flash('success', 'First Register tha plan ');
        res.redirect('/plan2buy');
      }
    }
  })
})

app.get('/plan2api', function (req, res) {
  let url_parts = url.parse(req.url, true);
  const responsedata = url_parts.query;
  if (responsedata.payment_id) {
    const clientID = req.user._id;
    plan2user.findOne({
      custid: clientID
    }, function (err, result) {
      if (err)
        console.log(err)
      else {
        var nameArr = responsedata.amount.split(',');
        const currentdate = moment(new Date()).format("MM/DD/YYYY");
        const currenttime = new Date().toLocaleTimeString();
        var arr = {
          date: currentdate,
          time: currenttime,
          gold_amt: nameArr[0],
          paid_amt: nameArr[1]
        };
        result.c_amount.push(arr);
        result.save();
        res.redirect('/chooseplan1')
      }
    });
  }
});

//3rd plan implementation
//create a chat bot type system









//admin nom_claim

app.get("/admin_nom_claim", function (req, res) {

  const arr = [];

  user.find({}, function (err, result) {

    result.forEach((item) => {
      arr.push(item);

    });

    res.render("nomclaim", {
      data: arr,
      expressFlash: req.flash('success')
    })


  })
});

//user nomineee claim
app.get("/nom_claim", function (req, res) {
  res.render("nomineeupload", {
    expressFlash: req.flash('success')
  })
})

var count = 0;
app.post('/nomineeupload_1', upload.single("image"), (req, res, next) => {
  var obj = {
    nom_img: {
      data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
      contentType: 'image/png',
      msg: req.user.name + " has uploades a new documents"
    }
  }
  user.updateOne({
    _id: req.user._id
  }, obj, function (err, user) {
    if (err) throw new Error(err);
    req.flash('success', 'Nomineee File Uploaded Successfully');
    res.redirect(301, '/nom_claim');
  })
})


//admin panel details
//document link rendering


//plan1 rendering

app.get("/plan1customers", function (req, res) {

  const arr = [];

  plan1user.find({}, function (err, result) {

    result.forEach((item) => {
      arr.push(item);

    });


    res.render("view_b", {
      data: arr
    });
  });
});



//see details rendering of plan 1
app.get('/form1/:title', function (req, res) {
  const id = req.params.title;
  var id2 = mongoose.Types.ObjectId(id);
  plan1user.findOne({
    custid: id2
  }, function (err, result) {
    if (err) {
      console.log(err)
    } else {
      res.render("customerdetails", {
        data: result.c_amount,
        result: result
      });
    }
  });
});

//all user rendering
app.get('/form11/:title', function (req, res) {
  const id = req.params.title;
  console.log(typeof (id));
  plan1user.findOne({
    custid: id
  }, function (err, result) {
    if (err) {
      console.log(err)
    } else {
      res.render("customerdetails", {
        data: result.c_amount,
        result: result
      });
    }
  });
});
//form22

//see details rendering of plan 2
app.get('/form22/:title', function (req, res) {
  const id = req.params.title;

  plan2user.findOne({
    custid: id
  }, function (err, result) {
    if (err) {
      console.log(err)

    } else {

      res.render("customerdetails2", {
        data: result.c_amount,
        result: result
      });
    }
  });
});

//plan2 customers in admin
app.get("/plan2customers", function (req, res) {

  const arr = [];

  plan2user.find({}, function (err, result) {
    result.forEach((item) => {
      arr.push(item);

    });

    res.render("view_b2", {
      data: arr
    });
  });
});

//see details rendering of plan 2
app.get('/form2/:title', function (req, res) {
  const id = req.params.title;

  var id2 = mongoose.Types.ObjectId(id);


  plan2user.findOne({
    custid: id2
  }, function (err, result) {
    if (err) {
      console.log(err)

    } else {

      res.render("customerdetails2", {
        data: result.c_amount,
        result: result
      });



    }


  });
});

//user panel
app.get("/details", function (req, res) {
  res.render("respectiveplan", {
    expressFlash: req.flash('success')
  })



})
//plan1 details user
app.get("/plan1_details", function (req, res) {
  plan1user.findOne({
    custid: req.user._id
  }, function (err, result) {

    if (err) {
      console.log(err);

    } else {
      if (result) {
        const name = result.name;
        const phone = result.phone;
        const email = result.email;
        const start = result.registred_date;
        const arr = result.c_amount;
        const premium = result.premium_amount;

        res.render("userchemedetails", {
          name: name,
          email: email,
          phone: phone,
          start: start,
          data: arr,
          premium: premium
        })
      } else {
        req.flash('success', 'You have Not Subscribed To This Plan  ');
        res.redirect('/details');
      }
    }
  });
})
//plan2user details

app.get("/plan2_details", function (req, res) {
  plan2user.findOne({
    custid: req.user._id
  }, function (err, result) {

    if (err) {
      console.log(err);

    } else {
      if (result) {
        const name = result.name;
        const phone = result.phone;
        const email = result.email;
        const start = result.registred_date;
        const arr = result.c_amount;

        res.render("userscheme2", {
          name: name,
          email: email,
          phone: phone,
          start: start,
          data: arr
        })
      } else {
        req.flash('success', 'You have Not Subscribed To This Plan  ');
        res.redirect('/details');
      }
    }
  });
})
//plan3 details user panel


app.get("/plan3_details", function (req, res) {
  plan2user.findOne({
    custid: req.user._id
  }, function (err, result) {
    if (err) {
      console.log(err);
    } else {
      if (result) {

        const name = result.name;
        const phone = result.phone;
        const email = result.email;
        const start = result.registred_date;
        const arr = result.c_amount;
        res.render("userchemedetails", {
          name: name,
          email: email,
          phone: phone,
          start: start,
          data: arr
        })
      } else {
        req.flash('success', 'You have Not Subscribed To This Plan  ');
        res.redirect('/details');
      }
    }
  });
})


// all kyc details
app.get("/allkycdetails", function (req, res) {

  const arr = [];

  user.find({}, function (err, result) {

    result.forEach((item) => {
      arr.push(item);

    });
    res.render("viewb_3", {
      data: arr,
      expressFlash: req.flash('success')
    })


  })
});
//kyc document rendering by clicking see details
app.get('/kyc/:title', function (req, res) {
  const id = req.params.title;
  user.findOne({
    _id: id
  }, function (err, result) {
    if (result.img.data) {
      res.render("eachdoc", {
        item: result
      });
    } else {
      {
        req.flash('success', 'User didnt upload document for kyc approval');
        res.redirect(302, '/allkycdetails');
      }
    }
  })
});

//nomclaim document rendering by clicking see details
app.get('/nominee/:title', function (req, res) {
  const id = req.params.title;
  user.findOne({
    _id: id
  }, function (err, result) {
    if (result.nom_img.data) {
      res.render("nomdoc", {
        item: result
      });
    } else {
      req.flash('success', 'This Customer didnt Claim for Nominee ')
      res.redirect('/admin_nom_claim');
    }
  })
});

//My documents
app.get('/mydocuments', function (req, res) {

  const id = req.user._id;
  user.findOne({
    _id: id
  }, function (err, result) {
    if (err) throw new Error
    if (result.img.data && result.nom_img.data) {
      res.render("myuserkyc", {
        item: result
      });
    } else {
      req.flash('success', "Not uploaded yet please upload it first");
      res.redirect('/kyc');
    }
  })
})

//all users rendering
app.get("/allusersdetails", function (req, res) {
  const arr = [];
  user.find({}, function (err, result) {
    result.forEach((item) => {
      arr.push(item);

    });

    res.render("allusers", {
      data: arr
    })
  })
});
//complete profile rendering by clicking see details
//incomplete

app.get('/details/:title', function (req, res) {
  const id = req.params.title;
  user.findOne({
    _id: id
  }, function (err, result) {
    if (result.img.data) {
      res.render("alldoc", {
        item: result
      });
    } else {
      {
        res.render("docwithoutimg", {
          item: result
        });
      }
    }
  })
});

app.use((req, res, next) => {
  res.status(404).render('404');
});
//server port listening
app.listen(PORT, function () {
  console.log('listening on *:3000');
});
