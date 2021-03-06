///VARS -------//////////////////////////////////////////////////////////
var json = {};
var map = document.getElementById("map");
var ctx = map.getContext("2d");
var socket = io.connect();
var xwin = window.innerWidth / 2;
var ywin = window.innerHeight / 2;
var userplayer = null;
var coredata = {};
var TeamSelected = null;
var serverMessage = null;
var serverMessageTimer = 0;
var serverMessageWindow = 0;
var serverTime = 6000
var dialog = null;
var dialogPointers = [null, null, null, null, null];
var selector = 0;
var currentDirKey = null;
var currentDir = null;
var controlState = "character";




///// METHODS ///////////////////////////

function resize(){
	var sels = ["selBlue", "selRed", "selGreen", "selGold"]
	if (window.innerWidth < window.innerHeight){
		map.style.width = window.innerWidth + "px";
		for(i=0; i < sels.length; i++) {
			document.getElementById(sels[i]).style.width = window.innerWidth/4 + "px";
			document.getElementById(sels[i]).style.height = window.innerWidth/4 + "px";
		};
	} else {
		map.style.width = window.innerHeight+"px";
		for(i=0; i < sels.length; i++) {
			document.getElementById(sels[i]).style.width = window.innerHeight/4 + "px";
			document.getElementById(sels[i]).style.height = window.innerHeight/4 + "px";
		};
	}
}


function add_player(team){
	var playername = "p" + socket.io.engine.id;
	var newplayerdata = {};
	newplayerdata[playername] = {"pos":"818.782", "dir": "2", "state":"0", "effects": {}, "health": 140, "maxHealth": 140, "mana": 100, "maxMana": 100, "alerttimer": 0, "team": team, "slot1": "sword1", "slot2": "bow1", "slot3": "spell1" , "origin": "818.782", "closeChunks": [], "h": 4, "w": 4};
	console.log(newplayerdata);
	userplayer = playername;
	var elem = document.getElementById("chooseteam");
	elem.parentNode.removeChild(elem);
        socket.emit('add_player', newplayerdata);
};

function charAlg(code){
	block = code.split(".");
	yvalue = ((block[0] -1) * 64) + (((block[1]/2) - 1) * 16);
	anims = [0, 48, 96, 144, 192, 240, 288, 336, 384, 432, 480]
	if (block[2] < 10){
		xvalue = anims[0] + (block[2] * 16);
	}
	if (block[2] < 100 && block[2] > 9 ){
		prts=block[2].split("")
		xvalue = anims[prts[0]] + (prts[1] * 16);
	}
	return [charsprites,xvalue,yvalue,16,16];
}

function draw(){
	serverTime -= 1;
	if ( userplayer !== null ){
		//CLEAN canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.font='8px tiny';
		ctx.textAlign="left";
		// DRAW map ///////////////////////////////////
		ctx.drawImage(map1, (32 - campos[0])*2 , (34 - campos[1])*2)
		//Get all sprite locations
		db = coredata;
		db.reverse();
		db.sort(function(a,b){return a.split(".")[4] - b.split(".")[4]})
		for (var code in db){
			blk = db[code].split(".");
			//Draw each sprite
			if (db[code].length > 0){
				image2draw = charAlg(db[code]);
				image2draw.push((blk[3] - campos[0] + 28)*2, (blk[4] - campos[1] + 28)*2, 16, 16);
				ctx.drawImage.apply(ctx, image2draw);

			};
		};
		// Draw the top layer of the map
		ctx.drawImage(map2, (32 - campos[0])*2 , (32 - campos[1])*2)

		//////////////////// TIME OF DAY SHADERS //////////////////////
		if (serverTime < 3400 && serverTime > 3000){
			ctx.globalCompositeOperation = "color-burn";
			percent = (40 - ((serverTime - 3000)/10))/100
			style = "rgba(0,21,211," + percent + ")"
			ctx.fillStyle=style;
			ctx.fillRect(0,0,128,128);
			ctx.globalCompositeOperation = "source-over";
		}

		if (serverTime <= 3000 && serverTime > 400){
			ctx.globalCompositeOperation = "color-burn";
			percent = 0.4
			style = "rgba(0,21,211," + percent + ")"
			ctx.fillStyle=style;
			ctx.fillRect(0,0,128,128);
			ctx.globalCompositeOperation = "source-over";
		}

		if (serverTime <= 400){
			ctx.globalCompositeOperation = "color-burn";
			percent = ((serverTime)/10)/100
			style = "rgba(0,21,211," + percent + ")"
			ctx.fillStyle=style;
			ctx.fillRect(0,0,128,128);
			ctx.globalCompositeOperation = "source-over";
		}

		//////////// UI stuff ////////////////////
		//Health
		ctx.fillStyle= "grey";
		ctx.fillRect(1,1, 20,7)
		ctx.fillStyle= "#00ff38";
		ctx.fillRect(1,1, Math.round((playerHealth/playerMaxHealth)*20),7)
		ctx.fillStyle= "grey";
		ctx.fillRect(24,1, 20,7)
		ctx.fillStyle= "#850E14";
		ctx.fillRect(24,1, Math.round((playerMana/playerMaxMana)*20),7)
		image2draw = charAlg("10.4.1.834.710");
		image2draw.push(90, 0, 8, 8);
		ctx.drawImage.apply(ctx, image2draw);
		ctx.fillText("J", 85, 8);
		image2draw = charAlg("10.4.2.834.710");
		image2draw.push(105, 0, 8, 8);
		ctx.drawImage.apply(ctx, image2draw);
		ctx.fillText("K", 100, 8);
		image2draw = charAlg("18.6.23.0.0");
		image2draw.push(120, 0, 8, 8);
		ctx.drawImage.apply(ctx, image2draw);
		ctx.fillText("L", 115, 8);
		//Dialog
		if (dialog != null){
			ctx.fillStyle= "rgba(15,15,15,0.85)"
			ctx.fillRect(0,74,128,64);
			ctx.fillStyle= "grey";
			ctx.fillText(dialog[0], 3, 84);
			ctx.fillText(dialog[1], 3, 94);
			ctx.fillText(dialog[2], 3, 104);
			ctx.fillText(dialog[3], 3, 114);
			ctx.fillText(dialog[4], 3, 124);
			ctx.fillText(">", -1, 84 + (10*selector));
		}

		// If server message, display now
		if (serverMessage != null){
			if (serverMessageWindow > 20){
				serverMessageTimer += 1
			} else if (playerHealth > 0){
				serverMessageTimer -= 1
			}
			serverMessageWindow -= 1
			var message = serverMessage.split("|");
			ctx.textAlign="center";
			style = "rgba(15,15,15," + serverMessageTimer/40 + ")"
			ctx.fillStyle=style;
			ctx.fillRect(0,0,128,128);
			style = "rgba(255,255,255," + serverMessageTimer/20 + ")"
			ctx.fillStyle=style;
			ctx.font='8px small';
			ctx.fillText(message[0], 64, 62);
			ctx.font='8px tiny';
			ctx.fillText(message[1], 64, 72);
			if (serverMessageTimer <= 0) {
				serverMessageTimer = 0;
				serverMessage = null;
			console.log(serverMessageTimer)
			}
		}
	};
};

//mOVEMENT /////////////////////////////////////////


function control(action){
	if (action == currentDir){return};
	switch (action){
		case "2":
			if(controlState == "character"){	socket.emit('action', [userplayer, "2"]); } else { if (selector > 0){selector -= 1}  }
			break;
		case "4":
			if(controlState == "character"){	socket.emit('action', [userplayer, "4"]); } else { selector = selector }
			break;
		case "6":
			if(controlState == "character"){	socket.emit('action', [userplayer, "6"]); } else { if (selector < 4){selector += 1}  }
			break;
		case "8":
			if(controlState == "character"){	socket.emit('action', [userplayer, "8"]); } else { selector = selector }
			break;
		case "movenull":
			if(controlState == "character"){socket.emit('action', [userplayer, "movenull"]);}
			break;
		case "attacknull":
			if(controlState == "character"){socket.emit('action', [userplayer, "attacknull"]);}
			break;
		case "interact":
			if(controlState == "character"){
				socket.emit('action', [userplayer, "interact", null]); console.log('interact');
			} else {
				if (dialogPointers == "exit" || dialogPointers[selector] == "exit"){
					selector = 0;
					dialogPointers = [null, null, null, null, null];
					dialog = null;
					controlState = "character";
					return;
				}
				socket.emit('action', [userplayer, "interact", dialogPointers[selector]]); console.log('speak', dialogPointers[selector]);
			}
			break;
		case "attack1":
			if (controlState == "character"){socket.emit('action', [userplayer, "attack1"]);}
			selector = 0;
			dialogPointers = [null, null, null, null, null];
			dialog = null;
			controlState = "character";
			break;
		case "attack2":
			if (controlState == "character"){socket.emit('action', [userplayer, "attack2"]);}
			selector = 0;
			dialogPointers = [null, null, null, null, null];
			dialog = null;
			controlState = "character";
			break;
		case "attack3":
			if (controlState == "character"){socket.emit('action', [userplayer, "attack3"]);}
			selector = 0;
			dialogPointers = [null, null, null, null, null];
			dialog = null;
			controlState = "character";
			break;
	}
	if (["2", "4", "6", "8", "null"].indexOf(action) !== -1) {currentDir = action;}
}

///// GET PLAYER TEAM AND STUFF ////
document.getElementById("selBlue").addEventListener("click", function(event) { add_player(1); });
document.getElementById("selGreen").addEventListener("click", function(event) { add_player(2); });
document.getElementById("selRed").addEventListener("click", function(event) { add_player(3); });
document.getElementById("selGold").addEventListener("click", function(event) { add_player(4); });


window.addEventListener("resize", function() {
	resize();
});
resize();
///// USER INPUT for player movement  ////////////////////////////   192

document.onkeydown= function(event) {
		var key= (event || window.event).keyCode;
		if (key == 74){ control("attack1"); return };
		if (key == 75){ control("attack2"); return };
		if (key == 76){ control("attack3"); return };
		if (key == 192){ console.log(serverTime, coredata, " currentDirKey ", currentDirKey); return };
		if (key == 73){ control("interact"); return };
		//wasd
		if (key == 87){ control("2") };
		if (key == 68){ control("4") };
		if (key == 83){ control("6") };
		if (key == 65){ control("8") };
		// arrows
		if (key == 38){ event.preventDefault(); control("2") };
		if (key == 39){ event.preventDefault(); control("4") };
		if (key == 40){ event.preventDefault(); control("6") };
		if (key == 37){ event.preventDefault(); control("8") };
		if ([74, 75, 76].indexOf(key) == -1){
			currentDirKey = key;
		}
};


document.onkeyup= function(event) {
		var key= (event || window.event).keyCode;
		if (key == currentDirKey){
			currentDirKey = null;
			currentDir = null;
			control("movenull");
		} else if ([74, 75, 76].indexOf(key) > -1){
			control("attacknull");
		};
};






////// GET data //////////////
socket.on('start', function(data) {
	TeamSelected = true;
	serverTime = data;
	console.log("Player Initialized:", data);
});

socket.on('dialog', function(data) {
	dialog = data[0];
	dialogPointers= data[1];
	controlState = "dialog";
	console.log("Dialog gottedidid:", data);
});

socket.on('serverMessage', function(data) {
	serverMessage = data.message;
	serverTime = data.time;
	console.log("serverMessage:", serverMessage);
	serverMessageTimer = 0;
	serverMessageWindow = 40;
});

socket.on('camera', function(data) {
		campos = data[0].split(".");
		playerHealth = data[1]
		playerMaxHealth = data[2]
		playerMana = data[3]
		playerMaxMana = data[4]
});

socket.on('getdata', function(data){
	coredata = data;
	//updatehud();
	//moveplayers(data.players);
	if (TeamSelected !== null) {
		draw(coredata);
	};
});





////// UTILITY EVENTS //////////////////////////

var tc = new Hammer(map);
tc.get('pan').set({ direction: Hammer.DIRECTION_ALL });

tc.on("tap", function(ev){control("attack1"); return });

tc.on("press", function(ev){control("interact"); return });

tc.on("panup", function(ev){
	control("2")
});
tc.on("pandown", function(ev){
  control("6")
});
tc.on("panright", function(ev){
  control("4")
});
tc.on("panleft", function(ev){
  control("8")
});
map.addEventListener('touchend', touchend, false);
function touchend(ev){
	currentDirKey = null;
	currentDir = null;
	control("movenull")
};
