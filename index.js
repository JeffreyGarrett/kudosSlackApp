var express = require('express');
var app = express();
var url = require('url');
var request = require('request');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
const sgMail = require('@sendgrid/mail');
const moment = require('moment');
var GphApiClient = require('giphy-js-sdk-core');
client = GphApiClient(process.env.GIPHY_CLIENT_KEY);
const gb = require("geckoboard")(process.env.GB_Key);
gbOptions = {
    "id": "kudos.text",
    "fields": {
        "reciever": { "type": "string", "name": "Reciever", "optional": false },
        "description": { "type": "string", "name": "Description", "optional": false }
    }
}

console.log(process.env.CULTURE_VALUES)
const cultureValues = JSON.parse(process.env.CULTURE_VALUES)

// slack setup
let slackBotToken = (process.env.SLACK_BOT_TOKEN)
let slack = require('slack');
let kudosBot = new slack({});

//middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('port', (process.env.PORT || 9001));

//mongoose setup
var schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_URI);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    // we're connected!
});

//kudos mongoose defined model
var kudosGivenSchema = new schema({
    Date: { type: Date, default: Date.now },
    slackBody: mongoose.Schema.Types.Mixed
});
//instantiate model
var kudosGivenModel = mongoose.model('kudosGivenModel', kudosGivenSchema);

//////*********************-----------routes-----------**************** */
///test app is up route
app.get('/', function (req, res) {
    res.send('It works!');
});

//tests getting the giphy
app.get('/giphy', function (req, res) {
    console.log(req.query.hwr);
    var hwr = req.query.hwr;
    
    client.search('gifs', { "q": hwr })
        .then((response) => {
            ;
            var max = response.data.length;
            var min = 0;
            var giphyUrl = { url: "http://i.giphy.com/media/" };
            var randomNumber = Math.floor(Math.random() * (max - min)) + min;
            giphyUrl.url = giphyUrl.url + response.data[randomNumber].id + "/giphy-downsized.gif";
            console.log(response.data[randomNumber])
            res.setHeader('Content-Type', 'application/json');
            console.log(giphyUrl);
            res.send(giphyUrl);
        })
        .catch((err) => {
            console.error("Giphy is throwing error", err);
        })
});

//kudos endpoint to handle both the slash command and incoming actions
app.post('/kudos', async function (req, res) {
    console.log(req.body);
    if (req.body.hasOwnProperty('payload')) {
        var body = JSON.parse(req.body.payload);
        console.log(body);
        if (body.callback_id == "hwr") {

            var kudos = new kudosGivenModel();

            kudos.slackBody = body;
            try {
                var users = await kudosBot.users.info({ "token": slackBotToken, "user": body.submission.kudosReceiver });
                console.log("in getUser Funciton", users)
                kudos.slackBody.submission.kudosReceiverName = users.user.real_name;

            } catch (error) {
                console.error("Error saving name: ", error);
                return res.status(500).send("Error");
            }

            kudos.save(function (error, result) {
                if (error) {
                    console.error("This is save error: ", error);
                    return res.status(404).send("Not Found");
                } else {


                    res.status(200).send()
                    if (process.env.SENDGRID_KEY && process.env.SENDGRID_TEMPLATE_ID) {
                        sendEmail(kudos.slackBody);
                    }

                    request(process.env.BASE_URL + "giphy?hwr=" + body.submission.hwr, function (error, response, giphybody) {
                        console.log('error:', error);
                        console.log('statusCode:', response && response.statusCode);
                        var giphy = JSON.parse(giphybody);
                        console.log('body:', giphybody); // Print the HTML for the Google homepage.
                        console.log('parsed body: ', giphy);

                        /*****************************this is section for sending data to geckoboard ******************/
                        if (process.env.GB_Key) {
                            gb.datasets.findOrCreate(gbOptions, function (err, dataset) {
                                if (err != null) {
                                    console.error(err);
                                }

                                var gbItems = [{
                                    reciever: body.submission.kudosReceiverName,
                                    description: body.submission.Description
                                }]
                                console.log(gbItems);

                                dataset.post(gbItems, null, function (err) {
                                    if (err != null) {
                                        console.error("Data set error", err);
                                    } else {
                                        console.log("Geckoboard dataset working correctly");
                                    }
                                })
                            });
                        }



                        var slackReplyOptions = {
                            //url: "https://slack.com/api/chat.postMessage",
                            url: body.response_url,
                            method: 'post',
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + slackBotToken
                            },
                            json: true,
                            body: {
                                text: "*<@" + body.user.id + "> just gave a kudos to <@" + body.submission.kudosReceiver + "> for " + body.submission.hwr + "!!*  \nHere's what was said... \n_"
                                    + body.submission.Description + "_",
                                response_type: "in_channel",
                                attachments: [
                                    {
                                        "title": "Someone Got a Kudos!!",
                                        //"text": body.submission.Description,
                                        "image_url": giphy.url
                                        //"http://i.giphy.com/media/kmYBXYUp3K8lG/giphy.gif"
                                        //
                                        //"https://media1.giphy.com/media/M8DHFvLMzGSkM/200_s.gif"
                                    }
                                ]
                            }

                        }
                        //console.log(giphybody.url);
                        request(slackReplyOptions, function (error, response, body) {
                            console.log('error:', error); // Print the error if one occurred
                            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                            console.log('body:', body); // Print the HTML for the Google homepage.
                        });
                    })

                }
            });

        }
    } else {
        console.log("entering kudos \n", req.body)
        var options = {
            url: "https://slack.com/api/dialog.open",
            method: 'post',
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + slackBotToken
            },
            json: true,
            body: {
                "trigger_id": req.body.trigger_id,
                "dialog": {
                    "callback_id": "hwr",
                    "title": "Give a kudos!",
                    "submit_label": "Submit",
                    "notify_on_channel": false,
                    "elements": [
                        {
                            "label": "Who Gets A Kudos",
                            "name": "kudosReceiver",
                            "type": "select",
                            "data_source": "users"
                        },
                        {
                            "label": "Which HWR Principle?",
                            "type": "select",
                            "name": "hwr",
                            "options": cultureValues
                        },
                        {
                            "label": "Description of action..",
                            "name": "Description",
                            "type": "textarea",
                            "hint": "This person really owned it by solving a big business issue"
                        }
                    ]
                }
            }
        };
        console.log(options)

        request(options, function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            console.log('body:', body); // Print the HTML for the Google homepage.
            res.status(200).send();
        });
    }

});

//troubleshooting function hwr
app.post('/hwr', function (req, res) {
    if (req.body.hasOwnProperty('callback_id')) {
        console.log(req.body);
    } else {
        console.log("we just got the post \n", req.body);
    }
});

app.get('/userInfo', async function (req, res) {
    console.log(req.query.user);
    if (req.query.hasOwnProperty('user')) {

        var users = await kudosBot.users.info({ "token": slackBotToken, "user": req.query.user });
        console.log("in getUser Funciton", users)
        return res.send(JSON.stringify(users.user.real_name));

    } else {
        console.log("nothing here", req);
        return res.status(404).send(req);
    }
})

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

function sendEmail(body) {
    console.log('body', body);

    sgMail.setApiKey(process.env.SENDGRID_KEY);
    const templateData = {
        recipient: body.submission.kudosReceiverName,
        nominator: body.user.name,
        date: moment().format('MMMM Do YYYY'),
        comments: body.submission.Description
    }
    templateData[body.submission.hwr] = true;


    const msg = {
        to: (process.env.ADMIN_EMAIL),
        from: (process.env.FROM_EMAIL),
        templateId: (process.env.SENDGRID_TEMPLATE_ID),
        subject: 'Kudos!',
        dynamic_template_data: templateData,
    };

    sgMail.send(msg, false, (err, result) => {
        console.error(err);
        console.log(result);
    });
}