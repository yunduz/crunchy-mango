/*-----------------------------------------------------------------------------
A simple Language Understanding (LUIS) bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

// This loads the environment variables from the .env file
require('dotenv-extended').load();

var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

// Create your bot with a function to receive messages from the user
// This default message handler is invoked if the user's utterance doesn't
// match any intents handled by other dialogs.
var bot = new builder.UniversalBot(connector, function (session, args) {
    session.send('You totally reached the default message handler. You said \'%s\'.', session.message.text);
});

bot.set('storage', tableStorage);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

// Create a recognizer that gets intents from LUIS, and add it to the bot
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);

// Add a dialog for each intent that the LUIS app recognizes.
// See https://docs.microsoft.com/en-us/bot-framework/nodejs/bot-builder-nodejs-recognize-intent-luis 
bot.dialog('GreetingDialog',
    (session) => {
        session.send('You totally reached the Greeting intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Greeting'
})

bot.dialog('HelpDialog',
    (session) => {
        session.send('You totally reached the Help intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send('You totally reached the Cancel intent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'Cancel'
})

bot.dialog('GetFoodInfoDialog',
    (session) => {
        session.send('You totally reached the GetFoodInfo intent. You said \'%s\'.', session.message.text);
        if(session.userData.isStudent) {

        } else if (session.userData.isAdult) {

        } else if (session.userData.isParent) {

        } else {
            session.userData.isFood = true;
            session.send('Are you a student, parent or adult?');
            session.endDialog();
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'GetFoodInfo'
})

var infoFood = [
    {   name:'The Greater Vancouver Food Bank', 
        info:'The Greater Vancouver Food Bank provides a 2-3 day food supplement to thousands of people each week by way of locations throughout the Greater Vancouver area.', 
        url: 'https://foodbank.bc.ca/find-help/', 
        image:'https://foodbank.bc.ca/wp-content/themes/foodbank/images/logo.png'}
];

var infoFoodStudents = [
    {   name:'Simon Fraser Student Society Food Bank', 
        info:'Facing hunger or serious financial pressures? Apply for and redeem a $25 food certificate up to 3 times per semester.', 
        url: 'http://sfss.ca/services/general-office-services/food-bank-program/', 
        image:'http://sfss.ca/wp-content/themes/sfss/img/sfss-logo-small.png'}
];

bot.dialog('IsStudentDialog',
    (session) => {
        session.send('You are totally a student. You said \'%s\'.', session.message.text);
        if(session.userData.isFood) {
            var message = new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments([...infoFood, ...infoFoodStudents].map(infoAsAttachmentHero));
            session.send(message);
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'IsStudent'
})

bot.dialog('IsParentDialog',
    (session) => {
        session.send('You are totally a parent. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'IsParent'
})

bot.dialog('IsAdultDialog',
    (session) => {
        session.send('You are totally an adult. You said \'%s\'.', session.message.text);
        session.endDialog();
    }
).triggerAction({
    matches: 'IsAdult'
})

// Helpers
function infoAsAttachmentHero(info) {
    return new builder.HeroCard()
        .title(info.name)
        .subtitle('%s', info.info)
        .images([new builder.CardImage().url(info.image)])
        .buttons([
            new builder.CardAction()
                .title('More details')
                .type('openUrl')
                .value(info.url)
        ]);
}

function infoAsAttachmentThumbnail(review) {
    return new builder.ThumbnailCard()
        .title(review.title)
        .text(review.text)
        .images([new builder.CardImage().url(review.image)]);
}
