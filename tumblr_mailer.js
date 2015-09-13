var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var querystring = require ("querystring");
var client = tumblr.createClient({
  consumer_key: 'YIBCEyXwZfh0nXKJMXmaCXEPSIF7oOrlvmVx6HlJyEDT38KIgx',
  consumer_secret: '43YvlJcKbR92ee9tOYShZiGe0fFB2OpoupD4sJQlwpyoZvD6Vj',
  token: 'PXMLpVtTKwgSYVhEn1LlUV4s2ElmOn18yflT301PuHQ2Hr1wZU',
  token_secret: 'MJxnrPecpGH468S4AgtRi4gWRYXwybC4lK9mlK9Cfns9mCO7Ss'
});
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('gYh5n8bpNBBK6zMIco5tYA');

var csvFile = fs.readFileSync("friend_list.csv","utf8");
//fs.readFileSync('email_template', 'utf-8');

//console.log(csvFile);
//console.log(typeof csvFile);
var csv_data = csvParse(csvFile);
//console.log(csv_data);

var emailAddress = "emailAddress";
var numMonthsSinceContact = "numMonthsSinceContact";
var firstName = "firstName";
var lastName = "lastName";
//console.log(csv_data[0]["firstName"] + " " + csv_data[0]["lastName"] +  "'s address: " + csv_data[0][emailAddress]);
//console.log(csv_data[1]["firstName"] + " " + csv_data[1]["lastName"] + "'s address: " + csv_data[1][emailAddress]);

var email = fs.readFileSync('email_template.ejs', 'utf-8'); // email_template.html?


var latestPosts = [];
client.posts('umacodes.tumblr.com', function(error, blog){
  var posts = blog.posts;
  var today = new Date();
  
  //console.log(posts.length);
  for (var i=0; i<posts.length; i++){
  	var postDate = new Date(posts[i].date);
  
  	if (today.getTime()-postDate.getTime() <= 604800000){
  		//console.log(blog.posts[i].title + "\n" + blog.posts[i].post_url);
   		latestPosts.push({title: blog.posts[i].title, href: blog.posts[i].post_url});
   	}
   }
   //console.log(latestPosts);
   console.log(csv_data);
   customizeEmail(csv_data, email); 
})




// csvParse function, takes in csvFile
/*Create the function csvParse that takes a CSV file(our csvFile variable) 
as an argument and parses the lines of the CSV file into an Array of Objects. 
The keys of each object should be: firstName, lastName, numMonthsSinceContact and emailAddress. 

In the Array of Object defined above, if you wanted to access Scott's email address, you could do so like this: 
csv_data[0][emailAddress]. Your code will generate a similar output as above. Notice how the outside array is 
defined with square-brackets while the object inside is defined using braces.

CAUTION: Be careful in your csv_data array of objects that you don't include the first line of the CSV file 
(the header row). This header row is for reading purposes but it's not actual data. */


function csvParse (inputFile){
	//var query = querystring.parse(inputFile, "\n");
	//query = querystring.parse(query, ",");
	//console.log(query);
	//console.log(typeof query);
	/*var values = {
		firstName: ... ,
		lastName: ...,
		numMonthsSinceContact: ...,
		emailAddress:
	};*/
	var content = inputFile.split("\n");
	//var numberOfItems = content.length;
	//console.log(content);
	var header = content[0].split(",");
	//console.log(header);
	var results = [];

	//content = content.split(",");
	//console.log(content);
	//console.log(header.length + typeof header);
	//console.log("header " + header);
	//console.log(header[0]);
	//console.log("content length " + content.length);

	for (var i=1; i<content.length; i++){ // use forEach?
	  /*var item = {
	  	firstName: "",
	  	lastName: "",
	  	numMonthsSinceContact: "",
	  	emailAddress: ""
	  };*/
	  var item = {};
	  var data = content[i].split(",");

	  if (data!=""){
		  //results[header[i-1]]=(data[i-1]);
		  //console.log("test: " + results);
		  item.firstName = data[0].trim();
		  item.lastName = data[1].trim();
		  item.numMonthsSinceContact = data[2].trim();
		  item.emailAddress = data[3].trim();
		  //for (var j=0; j<data.length; j++){
		  	//console.log("header type: " + typeof header[j]);
		  	//item[header[j].trim()] = data[j].trim();
		  //}
		  results.push(item);
		}
    }
     //console.log(results);
     return results;


}

function customizeEmail (recipients, template){
	//console.log(template.indexOf("FIRST_NAME"));
	/*for (var i=0; i<recipients.length; i++){ // use foreach instead 
		var outputEmail = template;
		//console.log(recipients[i]["firstName"]);
		console.log(recipients[i]["firstName"]);
		outputEmail = outputEmail.replace("FIRST_NAME", recipients[i]["firstName"]); // use REGEX
		outputEmail = outputEmail.replace("NUM_MONTHS_SINCE_CONTACT", recipients[i]["numMonthsSinceContact"]);
		console.log(outputEmail);
	}*/

	console.log(recipients.length);
	for (var i=0; i<recipients.length; i++){
			// render function takes a template and an object filled with properties that are used in the template. 
			//After an EJS is processed, it will return pure HTML, a string, that is ready to be sent in an email.
			var customizedTemplate = ejs.render(email, 
			                { firstName: recipients[i][firstName],  
			                  numMonthsSinceContact: recipients[i][numMonthsSinceContact],
			                  latestPosts: latestPosts
			                });

			//console.log(customizedTemplate);
			sendEmail(recipients[i][firstName], recipients[i][emailAddress], "Uma", "umachandran6@gmail.com", "Hello!", customizedTemplate);
		}

}



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

