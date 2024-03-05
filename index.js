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
	id: String,
	date: String
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


const createAndSaveExcercise = (username, description, duration, id, date, done) => {
	let excerciseRecord;
	excerciseRecord = Excercise({username: username, description: description, duration: duration, id: id, date: date});
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
		if (req.body.date.length == 0){
			let touseCurDate = new Date();
			let touseCurDateArray = touseCurDate.toDateString().split(" ");
			toPushDate = touseCurDateArray[0] + " " + touseCurDateArray[1] + " " + touseCurDateArray[2] + " " + touseCurDateArray[3];
			createAndSaveExcercise(idData['username'], req.body.description, req.body.duration, idData['_id'], toPushDate);
			res.json({username:idData['username'], description: req.body.description, duration: req.body.duration, date: toPushDate});
		}
		else{
			let dateArray = req.body.date.split("-");
			let givenDate = new Date(Number(dateArray[0]),Number(dateArray[1])-1,Number(dateArray[2]));
			let finalToPushDateArray = givenDate.toDateString().split(" ");
			let finalToPushDate = finalToPushDateArray[0] + " " + finalToPushDateArray[1] + " " + finalToPushDateArray[2] + " " + finalToPushDateArray[3];
			createAndSaveExcercise(idData['username'], req.body.description, req.body.duration, idData['_id'], finalToPushDate);		
			res.json({username:idData['username'], description: req.body.description, duration: req.body.duration, date: finalToPushDate});
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

async function throwLogs(req, res){
	let logs = await findExcercises(req.params['_id']);
	if (logs){
		console.log(logs);
		let i;
		let excerciseArray = [];
		for(i=0; i<logs.length; i++){
			excerciseArray.push({description: logs[i]['description'], duration: logs[i]['duration'], date: logs[i]['date']});
		}
		res.json({username: logs[0]['username'], count: Number(logs.length), id: logs[0]['id'], logs: excerciseArray})
	}
	else{
		console.log("No logs");
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
