const path = require("path");
var hn = require('hackernews-api');
const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require("express"); 
const app = express();

require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })  

const userName = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection:process.env.MONGO_COLLECTION};
const uri = `mongodb+srv://${userName}:${password}@cluster0.qbkiy4o.mongodb.net/test`;;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

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


app.post("/", (request, response) => {
    let keyword = request.body.keyword;

    const data = getStoriesBasedOnKey(serach);
    let table = "<table><th>Data</th><th>Info</th>";

    table += "<tr><td> keyword </td><td>" + data.keyword + "</td></tr>";
    table += "<tr><td> instances </td><td>" + data.instances + "</td></tr>";
    table += "<tr><td> date </td><td>" + data.date + "</td></table></tr>";


    table += "<td> titles </td><td>There are "+ data.titles.length + + "stories</td>";

    for(var i = 0; i < data.titles.length; i++){

        table += "<tr><td> story " +  i+1  + "</td><td>" +  data.titles[i]  + "</td></tr>";

    }

    table += "</table>";
    response.render("keyword", table);


});


