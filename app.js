/*-----------------------------------------------------------------------------
Weekend Fuelbag bot.
created by Yunduz and Evgeny (c) 2018 
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

bot.dialog('GreetingDialog',
    (session) => { 
		var message = 'Hello there! I\'m **"Weekend FuelBag"** bot!';
		message += '\nI know a lot of information about various resources for low income families and individuals.';
		message += '\nFor example, you can ask me about:';
		message += '\n- Food';
		message += '\n- Mental health';
		message += '\n- Housing';
		message += '\n- Child care';
		message += '\n- Tutoring';
		message += '\n- Sports';
		message += '\n- Clothing';
		message += '\n- Help for your pet';
		message += '\n\nOh, and I understand human language just well!';
		message += '\nWhat would you like to learn about?';
		session.send(message);
        session.endDialog();
    }
).triggerAction({
    matches: 'Greeting'
})

bot.dialog('HelpDialog',
    (session) => {
        var message = 'Sure, I will help you!';
		message += '\nJust as me about some topic like food, mental health or housing in a human language.';
		message += '\nI will parse the information from the message and will find an answer from my knowledge base.';

        session.send(message);
        session.endDialog();
    }
).triggerAction({
    matches: 'Help'
})

bot.dialog('CancelDialog',
    (session) => {
        session.send('Sure, let\'s pretend this never happened! What can I help you with?');
        session.endDialog();
        delete session.conversationData.isFood;
        delete session.conversationData.isStudent;
        delete session.conversationData.isParent;
        delete session.conversationData.isAdult;
    }
).triggerAction({
    matches: 'Cancel'
})

bot.dialog('GetFoodInfoDialog',
    (session) => {
        var message = 'Check out the following resources. I hope they help! Let me know if you have more questions!';
        if(session.conversationData.isStudent) {
            session.send(message);
            session.send(getStudentFoodInfo());
        } else if (session.conversationData.isAdult) {
            session.send(message);
            session.send(getAdultFoodInfo());
        } else if (session.conversationData.isParent) {
            session.send(message);
            session.send(getParentFoodInfo());
        } else {
            session.conversationData.isFood = true;
            session.send('Are you a student, parent or adult?');
            session.endDialog();
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'GetFoodInfo'
})

bot.dialog('IsStudentDialog',
    (session) => {
        session.conversationData.isStudent = true;

        if(session.conversationData.isFood) {
            session.send('Check out these resources. Hope this helps! Stay in school :) !');
            session.send(getStudentFoodInfo());
            delete session.conversationData.isFood;
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'IsStudent'
})

bot.dialog('IsParentDialog',
    (session) => {
        session.conversationData.isParent = true;

        if(session.conversationData.isFood) {
            session.send('Being a parent is not easy but I hope these resources help!');
            session.send(getParentFoodInfo());
            delete session.conversationData.isFood;
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'IsParent'
})

bot.dialog('IsAdultDialog',
    (session) => {
        session.conversationData.isAdult = true;

        if(session.conversationData.isFood) {
            session.send('Check out these resources, hope they help! Let me know if you have more questions.');
            session.send(getAdultFoodInfo());
            delete session.conversationData.isFood;
        }
        session.endDialog();
    }
).triggerAction({
    matches: 'IsAdult'
})


bot.dialog('GetChildCareInfoDialog',
    (session) => {
        session.send("Here are some resources for affordable child care.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetChildCareInfo'
})

bot.dialog('GetClothingInfoDialog',
    (session) => {
        session.send("Here are some resources about clothing.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetClothingInfo'
})

bot.dialog('GetMentalHealthInfoDialog',
    (session) => {
        session.send("Here are some resources about mental health.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetMentalHealthInfo'
})

bot.dialog('GetPetInfoDialog',
    (session) => {
        session.send("Here are some resources about help for your pet.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetPetInfo'
})


bot.dialog('GetSportsInfoDialog',
    (session) => {
        session.send("Here are some resources about sports equipment and participation.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetSportsInfo'
})

bot.dialog('GetTutoringInfoDialog',
    (session) => {
        session.send("Here are some resources about tutoring.")
        session.endDialog();
    }
).triggerAction({
    matches: 'GetTutoringInfo'
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

function getStudentFoodInfo() {
    return new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments([...infoFoodStudents, ...infoFood].map(infoAsAttachmentHero));
}

function getAdultFoodInfo() {
    return new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments(infoFood.map(infoAsAttachmentHero));    
}

function getParentFoodInfo() {
    return new builder.Message()
                .attachmentLayout(builder.AttachmentLayout.carousel)
                .attachments([...infoFoodParent, ...infoFood].map(infoAsAttachmentHero));    
}

var infoFood = [
    {   name:'The Greater Vancouver Food Bank', 
        info:'The Greater Vancouver Food Bank provides a 2-3 day food supplement to thousands of people each week by way of locations throughout the Greater Vancouver area.', 
        url: 'https://foodbank.bc.ca/find-help/', 
        image:'https://foodbank.bc.ca/wp-content/themes/foodbank/images/logo.png'
    },
    {
        name:'The Door is Open',
        info:'Soup and sandwich free lunch',
        url:'http://www.thedoorisopen.ca/free-lunch-program/',
        image:'http://www.thedoorisopen.ca/wp-content/uploads/2017/11/cropped-rcav-full_colour_reverse-300_md-rgb_digital.png'
    },
    {
        name:'Carnegie Centre cafeteria and kitchen',
        info:'The Carnegie Community Centre cafeteria is open seven days a week, 365 days a year. Meals are provided at an extremely low cost to assure that local low-income residents can readily access nutritious, fresh and affordable food.',
        url:'https://vancouver.ca/parks-recreation-culture/carnegie-centre-cafeteria.aspx',
        image:'https://vancouver.ca/images/cov/ui/covLogo.png'        
    }
];

var infoFoodParent = [
    {
        name:'SPFoodBank',
        info:'Home delivered food hampers for single parents that cannot use their local foodbanks',
        url:'http://www.spfoodbank.org/',
        image:''
    }
];

var infoFoodStudents = [
    {   name:'Simon Fraser Student Society Food Bank', 
        info:'Facing hunger or serious financial pressures? Apply for and redeem a $25 food certificate up to 3 times per semester.', 
        url:'http://sfss.ca/services/general-office-services/food-bank-program/', 
        image:'http://sfss.ca/wp-content/themes/sfss/img/sfss-logo-small.png'
    },
    {
        name:'The AMS Food Bank',
        info:'The AMS Food Bank is an emergency food relief service for UBC students in need. We offer various non-perishable foods, personal hygiene supplies, budgeting tips and information on additional resources in and around Vancouver. ',
        url:'http://www.ams.ubc.ca/student-services/food-bank/',
        image:'https://media.licdn.com/dms/image/C4D0BAQES4IiirDR_rg/company-logo_200_200/0?e=2159024400&v=beta&t=cUxThl5Yi83iINU0Xe4KATELq-4X-18m9JFIhry1zkc'
    },
    {
        name:'Weekend Fuelbag',
        info:'They give students in need access to food on weekends so they can come to school ready to learn.',
        url:'https://weekendfuelbag.ca/',
        image:'http://vanhacks.com/img/logos/weekend-fuelbag-logo-white.png'
    },
    {
        name:'Directions Youth Services',
        info:'Directions Youth Services is a Vancouver based resource that provides support to at-risk, homeless, or street-involved youth and young adults under 25.',
        url:'https://directionsyouthservices.ca/drop-in-centre/food-program/',
        image:'http://directionsyouthservices.ca/wp-content/uploads/2016/06/DIRECTIONS-YS_RGB1.jpg'
    }
];