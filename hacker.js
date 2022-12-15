const path = require("path");
var hn = require('hackernews-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express"); 
const app = express();
const portNumber = 5000;
const bodyParser = require("body-parser");
const { response } = require('express');

app.use(bodyParser.urlencoded({extended:false}));
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.qbkiy4o.mongodb.net/test`;;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.use(express.static(__dirname + '/templates'));


async function insertData(client, databaseAndCollection, data) {
    const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection)
	.insertOne(data);
}

async function insert(data) {
    try {
        await client.connect();   
        await insertData(client, databaseAndCollection, data);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

function getStoriesBasedOnKey(serach){
    var array = hn.getTopStories();
    var stories = [];
    for(let i = 0; i < 100; i++){
        let currStory = hn.getItem(array[i]);
        if(currStory.title.includes(serach)){
           
            stories.push(currStory.title);

        }
    }
    const data = {
        keyword: serach,
        instances: stories.length,
        titles: stories,
        date: new Date().toLocaleDateString()
    };

   
    insert(data);
    return data;
    
}

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");

app.get("/", (request, response) => {
    response.render("index");
});

app.get("/keyword", (request, response) => {
    response.render("keyword");
});


app.post("/keyword", (request, response) => {
    
    let key = request.body.key;

    const data = getStoriesBasedOnKey(key);
    let table = "<table border = \"1\"><th>Data</th><th>Info</th>";

    table += "<tr><td><strong> Keyword  </strong> </td><td>" + data.keyword + "</td></tr>";
    table += "<tr><td><strong> Instances  </strong></td><td>" + data.instances + "</td></tr>";
    table += "<tr><td><strong> Date </strong></td><td>" + data.date + "</td></tr>";


    table += "<tr><td> <strong>Titles </strong></td><td>There are "+ data.titles.length+ " stories</td></tr>";

    for(var i = 0; i < data.titles.length; i++){

        table += "<tr><td><strong>  Story" + (i+1) + "</strong></td><td>" + data.titles[i];
    }


    table += "</table>";
    response.render("afterSearch", {table: table});

});

app.get("/clear", (request, response) => {
    response.render("clear");
});

app.post("/clear", (request, response) => {
    
    const theDate = request.body.date;

    async function removeByDate(date) {
		try {
			await client.connect();
			const result = await client.db(databaseAndCollection.db)
			.collection(databaseAndCollection.collection)
			.deleteMany({date: date});
			const curr = { removed: result.deletedCount};
			
            response.render("removePost", curr);	

		} catch (e) {
			console.error(e);
		} finally {
			await client.close();
		}
	}

	removeByDate(theDate);
    
   
});

app.get("/getDate", (request, response) => {
    response.render("getDate");
});


app.listen(portNumber);
console.log(`Web server started and running at http://localhost:${portNumber}`);