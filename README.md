# Kudos Slackbot - 

This is a kudos slack app to help show appreciation for your team members.  Simply type the slack command you create and it will initiate a slack form that lets you select a user in your org, the business and a description of the kudos your giving.  The app will reply with the form input and a giphy for business principle. 

Includes integration with geckoboard for tv display
Includes integration with sendgrid in order to send the kudos to an email to be forwarded to the kudos boss.


## Slack
You need to create an app in your slack organization to get a slack token. Follow these steps.

Slack Admin: 
- create slack app: https://api.slack.com/apps/new
- select slash command on features
    - create command.  I like /kudos
    - fill out form (you can put a dummy url until complete)
- Go to bot users:  add bot user  
- add interactivity if you like.  Fill it in with the same urls and actions as slash command
- got to oauth & permission, authenticate the app in your workspace, copy the `bot user oath access token` that's what's going in the variable.

## GIPHY
- go here and sign up and create an app to giphy key: https://developers.giphy.com/

## Sendrid
Using sendgrid requires an account and a template to send from.  If you want to dynamically pass in values to your tempalate you will pass in the culture value selected and the message typed by the kudos giver.  See Sendgrid docs on how to work with sendgrid.

## Gecko Board
In order to use geckoboard, you'll have to create a key.  this app uses the dataset api so you may have to set that up prior to posting

# Deploy

### Deploying
You'll first provision all infrastructure with terraform and heroku.  If you want to deploy on a different platform you'll need to setup a mongodatabase, and environment variables yourself.


- rename tfvars.empty to terraform.tfvars and set the values
- go to `./terraform/`
- run `terraform init`
- run `terraform apply`
- go into your heroku account and setup a deployment straight from github.




## License

The MIT License (MIT)
Copyright (c) 2016 Andrew Mager

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
