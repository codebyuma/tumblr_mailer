var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var querystring = require ("querystring");
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('***'); // mandrill APIkey
/* tumblr API keys */
var client = tumblr.createClient({
  consumer_key: '***',
  consumer_secret: '***',
  token: '***',
  token_secret: '***'
});

var emailAddress = "emailAddress";
var numMonthsSinceContact = "numMonthsSinceContact";
var firstName = "firstName";
var lastName = "lastName";
var latestPosts = []; // array to store the latest blog posts

/* Read in and parse the contacts csv file */
var csvFile = fs.readFileSync("friend_list.csv","utf8");
var csv_data = csvParse(csvFile);

/* Read in and store the email template */
var email = fs.readFileSync('email_template.ejs', 'utf-8'); 

/* Retrieve the latest blog posts from tumblr and then call customizeEmail with the contacts list and template to send the posts */
client.posts('umacodes.tumblr.com', function(error, blog){
  var posts = blog.posts;
  var today = new Date();
  
  for (var i=0; i<posts.length; i++){
  	var postDate = new Date(posts[i].date);
    // if the post is less than 7 days old, add the title, url and date to the latestPosts array
  	if (today.getTime()-postDate.getTime() <= 604800000){ // 7 days in miliseconds, used to compare the times
   		latestPosts.push({title: blog.posts[i].title, href: blog.posts[i].post_url, date: blog.posts[i].date});
   	}
   }
   customizeEmail(csv_data, email); // call customizeEmail to create and send the customized email to all contacts in csv_data
})


/* csvParse function, takes in csvFile as an argument and parses the lines of the CSV file into an Array of Objects. 
The keys of each object should be: firstName, lastName, numMonthsSinceContact and emailAddress. 

CAUTION: Be careful in your csv_data array of objects that you don't include the first line of the CSV file 
(the header row). This header row is for reading purposes but it's not actual data. */
function csvParse (inputFile){

	var content = inputFile.split("\n"); // split file by line
	//var header = content[0].split(","); // capture the first line, the header row, stored in index 0 of content
	var results = []; // array to hold the contact objects as we parse

	content.forEach(function(row, rowIndex) { // for each item (row) in the content array except for the header row (index 0)
	  if (rowIndex!=0){
		  var contact = {}; // individual contact object
		  var data = row.split(","); // split the row using the comma as a delimiter

		  if (data!=""){ // store each item in the appropriate property for this contact object
			  contact.firstName = data[0].trim(); // use trim() to remove whitespace
			  contact.lastName = data[1].trim();
			  contact.numMonthsSinceContact = data[2].trim();
			  contact.emailAddress = data[3].trim();
			  results.push(contact); // add the contact object to the results array
			}
	 }
    })
     //console.log(results);
     return results; // return the results array of contact objects

}

// create and send customized email for each contact in the recipients array using the template.
function customizeEmail (recipients, template){

	recipients.forEach(function(contact){
		// The render function takes a template and an object filled with properties that are used in the template. 
		// After an EJS is processed, it will return pure HTML, a string, that is ready to be sent in an email.
		var customizedTemplate = ejs.render(email, 
		                { firstName: contact[firstName],  
		                  numMonthsSinceContact: contact[numMonthsSinceContact],
		                  latestPosts: latestPosts
		                });

		//console.log(customizedTemplate);
		sendEmail(contact[firstName], contact[emailAddress], "Uma", "umachandran6@gmail.com", "Hello!", customizedTemplate);
	
	})

}


//Use Mandrill to send the specified email message to the specified contacts
function sendEmail(to_name, to_email, from_name, from_email, subject, message_html){
    var message = {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
         console.log(message);
         console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });
 }

