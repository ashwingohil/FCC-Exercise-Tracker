const express = require('express')
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express()
const cors = require('cors')
require('dotenv').config()


mongoose.connect(process.env['MONGO_URI'], { useNewUrlParser: true, useUnifiedTopology: true });
const bodyParser = require("body-parser");

const UserSchema = new mongoose.Schema({
	username: String,
	_id: String
});

/*
const ExcerciseSchema = new mongoose.Schema({
	username: String,
	description: {
		type: String,
		required: true
	},
	duration: {
		type: Number,
		required: true
	},
	_id: {
		type: String,
		required: true,
		unique: false
	},
	date:{
		type: String,
		required: true
  }
});
*/

const ExcerciseSchema = new mongoose.Schema({
	username: String,
	description: String,
	duration: Number,
	date: String,
	id: String
	
});




app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use(bodyParser.urlencoded({extended: true}));
/*app.use(bodyParser.json());*/

let User;
let Excercise;
User = mongoose.model('User', UserSchema);
Excercise = mongoose.model('Excercise', ExcerciseSchema);



const findOneByShortId = (shortid, done) => {
	User.findOne({_id: shortid})
  .then((data) => {
    if(data){
      console.log("ShortID found" + " " + data);
      return data;
    }
    if(!data){
      return null;
    }
  })
  .catch((err) => console.log(err));
}

async function findInfoByShortId(shortid){
	let data = await User.findOne({_id: shortid});
	if(data){
		return data;
	}
	else{
		return null;
	}
}

const findOneByUsername = (username1, done) => {
  User.findOne({username: username1})
  .then((data) => {
    if(data){
      return data;
    }
    if(!data){
      return null;
    }
  })
  .catch((err) => console.log(err));
}


async function SaveUsername(username){
	var shortidcreated;
	let usernameDoc;
	do{
		shortidcreated = shortid.generate()
	}while(findOneByShortId(shortidcreated) != null);

	usernameDoc = User({username: username, _id: shortidcreated});
	try{
		await usernameDoc.save();
		return shortidcreated;
	}
	catch(err){
		return err;
	}
}

const createAndSaveUsername = (username, done) => {
  var shortidcreated;
  let usernameDoc;
  do{
    shortidcreated = shortid.generate()
  }while(findOneByShortId(shortidcreated) != null);

  usernameDoc = User({username: username, _id: shortidcreated});
  //shortidcreated = shortid.generate()  
  usernameDoc.save()
  .then((data) => {
    console.log("Saving.." + " ");
	return shortidcreated;
  })
  .catch((err) => {
    console.error(err);
  });
}


const createAndSaveExcercise = (username, description, duration, date, id, done) => {
	let excerciseRecord;
	excerciseRecord = Excercise({username: username, description: description, duration: duration, date: date, id: id});
	excerciseRecord.save()
	.then((data) => {
		console.log("Saving excersise...")
	})
	.catch((err) => {
		console.error(err);
	});
}



function getAllUsers(req, res){
	return User.find().
	then((data) => {
		if(data){
			res.json(data);
		}
		else{
			return null;
		}
	})
	.catch((err) => {
		console.error(err);
	});
}


async function pushExercise(req, res){
	let toPushDate;
  	console.log(req.params['_id'] + " " + typeof(req.params['_id']));
	let idData = await findInfoByShortId(req.params['_id']);  
  	console.log('idData ' + " " + idData);
	if (idData != null){
		console.log('body date ' + req.body.date);
		if (req.body.date == undefined){
			let touseCurDate = new Date();
			let touseCurDateArray = touseCurDate.toDateString().split(" ");
			toPushDate = touseCurDateArray[0] + " " + touseCurDateArray[1] + " " + touseCurDateArray[2] + " " + touseCurDateArray[3];
			createAndSaveExcercise(idData['username'], req.body.description, Number(req.body.duration), toPushDate, idData['_id']);
			//res.json({username:idData['username'], description: req.body.description, duration: req.body.duration, date: toPushDate});
			console.log("EX JSON" + req.body.description + " " + req.body.duration + " " + toPushDate)
			res.json({username:idData['username'], _id:idData['_id'], description: req.body.description, duration: Number(req.body.duration), date: toPushDate});
			
		}
		else{
			console.log('body date2 ' + req.body.date);
			let dateArray = req.body.date.split("-");
			let givenDate = new Date(Number(dateArray[0]),Number(dateArray[1])-1,Number(dateArray[2]));
			let finalToPushDateArray = givenDate.toDateString().split(" ");
			let finalToPushDate = finalToPushDateArray[0] + " " + finalToPushDateArray[1] + " " + finalToPushDateArray[2] + " " + finalToPushDateArray[3];
			createAndSaveExcercise(idData['username'], req.body.description, Number(req.body.duration), finalToPushDate, idData['_id']);		
			//res.json({username:idData['username'], description: req.body.description, duration: req.body.duration, date: finalToPushDate});
			console.log("EX JSON2" + req.body.description + " " + req.body.duration + " " + finalToPushDate)
			res.json({username:idData['username'], _id:idData['_id'], description: req.body.description, duration: Number(req.body.duration), date: finalToPushDate});
		}
	}
}

async function findExcercises(id){
	let logs = await Excercise.find({id:id});
	if (logs){
		return logs;
	}
	else{
		return null;
	}
}

async function rangeForExercise(startDate, endDate, id){
	let start = Number(startDate.toDateString().split("-")[0]);
	let end = Number(endDate.toDateString().split("-")[0]);
	let exerciselog = await Excercise.find({id: id});

	console.log(exerciselog.length);
	console.log(exerciselog[0]);
	let i;
	let finalLogArray = [];
	let startDateObject = new Date(startDate);
	let endDateObject = new Date(endDate);
	console.log('STARTDATE ' + " " + startDateObject + " " + startDateObject.toString());
	console.log('ENDDATE ' + " " + endDateObject);
	for(i=0; i<exerciselog.length; i++){
		let currentDateObject = new Date(exerciselog[i]['date']);
		if (startDateObject != undefined && endDateObject != undefined){
			if (currentDateObject >= startDateObject && currentDateObject <= endDateObject){
				finalLogArray.push(exerciselog[i])
			}
		}
		if (startDateObject != undefined && endDateObject == undefined){
			if (currentDateObject >= startDateObject){
				finalLogArray.push(exerciselog[i])
			}
		}
		if (startDateObject == undefined && endDateObject != undefined){
			if (currentDateObject <= endDateObject){
				finalLogArray.push(exerciselog[i])
			}
		}
		if (startDateObject.toString() === "Invalid Date" && endDateObject.toString() === "Invalid Date"){
			console.log("BOTH UNDEFINED LAST COND");
			finalLogArray.push(exerciselog[i])
		}
	}
	console.log("FINAL " + " " + finalLogArray)
	/*
	let mylog = exerciselog. fetch().forEach(function(item){
		Number(item.date.split(" ")[3]) >= start && Number(item.date.split(" ")[3]) <= end;
	});*/
	if (finalLogArray){
		//return exerciselog;
		return finalLogArray;
	}
	else{
		return null;
	}
}


async function throwLogs(req, res){
	console.log("FROM" + " " + req.query.from)
	console.log("TO" + " " + req.query.to)
	console.log("LIMIT" + " " + req.query.limit)
	if(req.query.from != undefined || req.query.to != undefined || (req.query.from == undefined && req.query.to == undefined && req.query.limit != undefined)){
		let fromdata = req.query.from;
		let todata = req.query.to;
		let limitdata = req.query.limit;

		if(limitdata != undefined){
			limitdata = Number(limitdata);
		}

		fromdata = String(fromdata);
		todata = String(todata);

		let startDate = new Date(fromdata); //.toDateString();
		let endDate = new Date(todata); //.toDateString();

		let edata = await rangeForExercise(startDate, endDate, req.params['_id']);

		console.log("TEMPLOG " + edata);
		let excerciseArray = [];
		let limiter;
		if (limitdata < edata.length){
			limiter = limitdata;
		}
		else if(limitdata == edata.length){
			limiter = edata.length;
		}
		else{
			limiter = edata.length;
		}
		for(i=0; i<limiter; i++){
			console.log('DESCRIP ' + " " + edata[i]['description'] + " " + edata.length)
			excerciseArray.push({description: String(edata[i]['description']), duration: Number(edata[i]['duration']), date: String(edata[i]['date'])});
			console.log('ARRAY ' + excerciseArray);
		}
		res.json({username: edata[0]['username'], count: Number(limiter), _id: edata[0]['id'], log: excerciseArray})
		//return;

	}
	else{

		let logs = await findExcercises(req.params['_id']);
		if (logs){
			console.log(logs);
			let i;
			let excerciseArray = [];
			for(i=0; i<logs.length; i++){
				console.log('DESCRIP ' + " " + logs[i]['description'] + " " + logs.length)
				excerciseArray.push({description: String(logs[i]['description']), duration: Number(logs[i]['duration']), date: String(logs[i]['date'])});
				console.log('ARRAY ' + excerciseArray);
			}
			res.json({username: logs[0]['username'], count: Number(logs.length), _id: logs[0]['id'], log: excerciseArray})
		}
		else{
			console.log("No logs");
		}
	}
}




app.post('/api/users', async function(req, res){
  console.log(req.body.username);
  //let id = createAndSaveUsername(req.body.username);
  let id = await SaveUsername(req.body.username);
  console.log("ID " + " " + id);
  res.json({username:req.body.username, _id:id});
});

app.get('/api/users', getAllUsers);
app.post('/api/users/:_id/exercises', pushExercise);
app.get('/api/users/:_id/logs', throwLogs);



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
