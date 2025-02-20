/* 
  Pomosaurus by mist8kengas (fork of: https://github.com/emendoza2/pomosaurus)
*/

require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs')

const client = new Discord.Client();

if (process.env.SH_TOKEN == '' || process.env.SH_TOKEN == undefined){client.login(process.env.DJS_TOKEN);}
else{client.login(process.env.SH_TOKEN);}

client.on('ready', ()=>{
  console.log('❤');
  client.user.setActivity('Type pd!help');
});

const CMD_PREFIX = "pd!"; /* command prefix */
const CMD_LIST = {
  "start": {
    "usage": `${CMD_PREFIX}start [work time] [small break time] [big break time]`,
    "description": "Start the pomodoro with default values (25, 5, 15)"
  },
  "tostart": {
    "usage": `${CMD_PREFIX}tostart [work time] [small break time] [big break time]`,
    "description": "Start a text-only pomodoro with default values"
  },
  "stop": {
    "usage": `${CMD_PREFIX}stop`,
    "description": "Stop the pomodoro"
  },
  "status": {
    "usage": `${CMD_PREFIX}status`,
    "description": "Check the current status of the pomodoro"
  },
  "dm": {
    "usage": `${CMD_PREFIX}dm`,
    "description": "Toggle the notifications via direct message"
  },
  "togtext": {
    "usage": `${CMD_PREFIX}togtext`,
    "description": "Toggle the channel text notifications"
  },
  "volume": {
    "usage": `${CMD_PREFIX}volume volume`,
    "description": "Change the volume of the alerts, defaults to 50"
  },
  "help": {
    "usage": `${CMD_PREFIX}help`,
    "description": "Get the list of commands"
  },
  "clear": {
    "usage": `${CMD_PREFIX}clear`,
    "description": "Deletes the last 30 messages related to the bot"
  }
}; /* commands + their usage & descriptions */
var COMMANDS = new Object(); Object.keys(CMD_LIST).forEach((ITEM, INDEX)=>{COMMANDS[INDEX] = (CMD_PREFIX + ITEM)}); COMMANDS = Object.values(COMMANDS);

class Pomodoro{
  constructor(workTime, smallBreak, bigBreak, connection, id, message, textOnly){
    this.id = id;
    this.workTime = workTime;
    this.smallBreak = smallBreak;
    this.bigBreak = bigBreak;
    this.peopleToDm = [];
    this.textAlerts = true;
    this.volume = 0.5;
    this.connection = connection;
    this.message = message;
    this.time = 1;
    this.timerStartedTime = new Date();
    this.dispatcher = null;
    this.timer = null;
    this.alertText = '';
    this.interval = null;
    this.textOnly = textOnly;

    /* if (!textOnly) {
      this.connection.voice.setSelfDeaf(true);
    } */

    this.startANewCycle();
  }

  startANewCycle(){
    try{
      if(this.time > 20){
        this.stopTimer();
        this.message.channel.send('You reached the maximum pomodoro cycles! Rest a little!');
        if(!this.textOnly){this.connection.disconnect();}

        container.removePomodoro(this.message.guild.id);
      }

      this.message.channel.send()

      if(this.time % 2 != 0 && this.time != 7){
        this.interval = this.workTime;
        this.alertText = `You worked for ${this.workTime / 60000}min! Time for a small break of ${this.smallBreak / 60000}min!`;
      }
      else if(this.time == 7){
        this.interval = this.workTime;
        this.alertText = `You worked for ${this.workTime / 60000}min! Time for a big break of ${this.bigBreak / 60000}min!`;
      }
      else if(this.time % 2 == 0 && this.time != 8){
        this.interval = this.smallBreak;
        this.alertText = `You finished your ${this.smallBreak / 60000}min break! Let's get back to work!`;
      }
      else if(this.time == 8){
        this.interval = this.bigBreak;
        this.alertText = `You finished your ${this.bigBreak / 60000}min break! Let's get back to work!`;
      }

      this.timerStartedTime = new Date();

      if(!this.textOnly){
        this.dispatcher = this.connection.play(fs.createReadStream(require('path').join(__dirname, './sounds/time-over.ogg')), {
          volume: this.volume,
        });

        this.dispatcher.on('end', ()=>{
          this.dispatcher = this.connection.play(fs.createReadStream(require('path').join(__dirname, './sounds/silence-fixer.ogg')));
        });
      }

      this.timer = setTimeout(()=>{
        this.time++;

        //Send Text Alerts
        if(this.textAlerts){
          this.message.channel.send(this.alertText);
        }

        //Send DM Alerts
        if(this.peopleToDm.length > 0){
          this.peopleToDm.forEach((person)=>{
            try{
              client.users.get(person).send(this.alertText);
            }
            catch(err){
              console.log(err);
            }
          });
        }

        //Start a New Cycle
        this.startANewCycle();
      }, this.interval);
    }
    catch(err){console.log(err);}
  }

  stopTimer(){
    clearTimeout(this.timer);
    if(!this.textOnly){
      this.dispatcher.destroy();
    }
  }

  addToDM(id, message){
    if(this.peopleToDm.filter((person) => person == id).length == 0){
      this.peopleToDm.push(id);
      message.reply('you will now receive the alerts via Direct Message!');
    }
    else{
      this.peopleToDm = this.peopleToDm.filter((person) => person != id);
      message.reply('you will stop receiving the alerts via Direct Message!');
    }
  }

  toggleNotifications(message){
    this.textAlerts = !this.textAlerts;

    if(this.textAlerts){
      message.channel.send('The text notifications have been turned on!');
    }
    else{
      message.channel.send('The text notifications have been turned off!');
    }
  }

  changeVolume(volume){
    this.volume = volume;
  }
}

class Container{
  constructor(){
    this.pomodoros = [];
  }

  addPomodoro(pomodoro){
    this.pomodoros.push(pomodoro);
  }

  removePomodoro(id){
    this.pomodoros = this.pomodoros.filter((pomodoro) => pomodoro.id != id);
  }
}

let container = new Container();

function checkParams(arg1, arg2, arg3, message){
  let checked = true;

  if(arg1){
    if(parseInt(arg1) < 5 || parseInt(arg1) > 120 || isNaN(parseInt(arg1))){
      message.channel.send('Insert a valid time between 5 and 120 minutes!');
      checked = false;
    }
  }

  if(arg2){
    if(parseInt(arg2) < 5 || parseInt(arg2) > 120 || isNaN(parseInt(arg2))){
      message.channel.send('Insert a valid time between 5 and 120 minutes!');
      checked = false;
    }
  }

  if(arg3){
    if(parseInt(arg3) < 5 || parseInt(arg3) > 120 || isNaN(parseInt(arg3))){
      message.channel.send('Insert a valid time between 5 and 120 minutes!');
      checked = false;
    }
  }

  return checked;
}

setInterval(()=>{
  container.pomodoros.forEach((pomodoro)=>{
    console.log(`${pomodoro.id}: ${pomodoro.time}: ${pomodoro.textOnly}`);
  });
  console.log('#############################');
}, 600000);

client.on('message', async (message)=>{
  if(!message.guild);

  const args = message.content.trim().split(' ');

  if(args[0] === COMMANDS[1]){
    //Check arguments
    if(!checkParams(args[1], args[2], args[3], message));

    //Check if there's already a pomodoro running on the server
    let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoro.length > 0){
      message.reply("There's already a pomodoro running!");
    }

    //Start the pomodoro
    try{
      if(args[1] && args[2] && args[3]){
        container.addPomodoro(new Pomodoro(parseInt(args[1] * 60000), parseInt(args[2] * 60000), parseInt(args[3] * 60000), null, message.guild.id, message, true));
      }
      else{
        container.addPomodoro(new Pomodoro(1500000, 300000, 900000, null, message.guild.id, message, true));
      }
    }
    catch(err){
      console.log(err);
      message.channel.send("I'm struggling to join your voice channel! Please check my permissions!");
    }

    message.channel.send("Pomodoro started! Rawr");
  }

  if(args[0] === COMMANDS[0]){
    //Check arguments
    if(!checkParams(args[1], args[2], args[3], message));

    if(message.member.voice.channel){
      let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

      if(pomodoro.length > 0){
        message.reply("There's already a pomodoro running!");
      }

      try{
        if(args[1] && args[2] && args[3]){
          container.addPomodoro(new Pomodoro(parseInt(args[1] * 60000), parseInt(args[2] * 60000), parseInt(args[3] * 60000), await message.member.voice.channel.join(), message.guild.id, message, false));
        }
        else{
          container.addPomodoro(new Pomodoro(1500000, 300000, 900000, await message.member.voice.channel.join(), message.guild.id, message, false));
        }
      }
      catch(err){
        console.log(err);
        message.channel.send("I'm struggling to join your voice channel! Please check my permissions!");
      }
    }
    else{
      message.channel.send('You have to be in a voice channel to start a pomodoro!');
    }
    message.channel.send("Pomodoro started! Rawr!");
  }

  //Stop the pomodoro
  if(args[0] == COMMANDS[2]){
    let pomodoroStop = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoroStop.length == 0){
      message.reply("There's no pomodoro currently running!");
    }

    if(!pomodoroStop[0].textOnly){
      if(!message.member.voice.channel){
        message.reply('You are not in a voice channel!');
      }
    }

    pomodoroStop[0].stopTimer();
    container.removePomodoro(message.guild.id);

    message.channel.send('Nice work! Glad I could help!');

    if(!pomodoroStop[0].textOnly){
      message.member.voice.channel.leave();
    }
  }

  if(args[0] == COMMANDS[3]){
    let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoro.length == 0){
      message.reply("There's no pomodoro currently running!");
    }

    let now = new Date();
    let timePassed = now.getTime() - pomodoro[0].timerStartedTime.getTime();
    let timeLeft;

    if(pomodoro[0].time % 2 != 0){
      timeLeft = parseInt((pomodoro[0].workTime - timePassed) / 60000);
      message.channel.send(`${timeLeft + 1}min left to your break! Keep it up!`);
    }
    else if(pomodoro[0].time % 2 == 0 && pomodoro[0].time != 8){
      timeLeft = parseInt((pomodoro[0].smallBreak - timePassed) / 60000);
      message.channel.send(`${timeLeft + 1}min left to start working!`);
    }
    else{
      timeLeft = parseInt((pomodoro[0].bigBreak - timePassed) / 60000);
      message.channel.send(`${timeLeft + 1}min left to start working!`);
    }
  }

  if(args[0] == COMMANDS[7]){
    const helpCommands = new Discord.MessageEmbed()
    .setColor('#f00')
    .setTitle('Pomosaur commands')
    .setDescription('Here is the list of commands to use the bot!');
    COMMANDS.forEach((item, index)=>{
      helpCommands.addField(Object.values(CMD_LIST)[index]['description'], Object.values(CMD_LIST)[index]['usage'], true);
    });
    message.reply(helpCommands);
  }

  if(args[0] == COMMANDS[4]){
    let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoro.length == 0){
      message.reply("There's no pomodoro currently running!");
    }

    if(!pomodoro[0].textOnly){
      if(!message.member.voice.channel){
        message.reply('You are not in a voice channel!');
      }
    }

    pomodoro[0].addToDM(message.author.id, message);
  }

  if(args[0] == COMMANDS[5]){
    let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoro.length == 0){
      message.reply("There's no pomodoro currently running!");
    }

    if(!pomodoro[0].textOnly){
      pomodoro[0].toggleNotifications(message);
    }
    else{
      message.channel.send("You can't disable text messages in a text-only pomodoro!");
    }

    if(!message.member.voice.channel){
      message.reply('You are not in a voice channel!');
    }
  }

  if(args[0] == COMMANDS[6]){
    let pomodoro = container.pomodoros.filter((pomodoro) => pomodoro.id == message.guild.id);

    if(pomodoro[0].textOnly){
      message.reply("You can't change the volume of a text-only pomodoro!");
    }

    if(pomodoro.length == 0){
      message.reply("There's no pomodoro currently running!");
    }

    if(!message.member.voice.channel){
      message.reply('You are not in a voice channel!');
    }

    if(args[1]){
      if(parseInt(args[1]) < 1 || parseInt(args[1] > 100 || isNaN(parseInt(args[1])))){
        message.channel.send('Please insert a valid number between 0 and 100');
      }
      else{
        pomodoro[0].changeVolume(args[1] / 100);
        message.channel.send(`The volume has been set to ${args[1]}`);
      }
    }
    else{
      message.channel.send('Please type a second argument with a number between 0 and 100');
    }
  }

  if(args[0] == COMMANDS[8]){
    let messagesProcessed = 0;
    let allDeleted = true;
    message.channel.fetchMessages({ limit: 30 })
    .then((messages)=>{
      messages.forEach((message)=>{
        let messageContent = message.content.trim().split(' ');
        if(COMMANDS.includes(messageContent[0]) || message.author.id == client.user.id){
          message.delete()
          .then(()=>{
            messagesProcessed++;
            if(messagesProcessed == 29 && !allDeleted){message.channel.send('There was a problem deleting some of the messages! Please check my permissions!');}
          })
          .catch(()=>{
            messagesProcessed++;
            allDeleted = false;
            if(messagesProcessed == 29 && !allDeleted){message.channel.send('There was a problem deleting some of the messages! Please check my permissions!');}
          });
        }
      });
    })
    .catch(()=>{message.channel.send('There was a problem deleting the messages! Please check my permissions!');});
  }
});
