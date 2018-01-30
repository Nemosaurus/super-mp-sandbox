///// Exports ///////////////////////////
module.exports = {
  startDialog: function (interacter) {
    startDialog(interacter);
  },
  getDialog: function (interacter, path) {
    getDialog(interacter, path);
  }
};

function getDialog(interacter, path){
  if (path[0] == "consumable"){
    console.log("consumable path: " + path)
    var verbage = ["","","Consumed" + coredata.chunks[path[1]][path[2]][path[3]][path[4]],"",""]
    consumable = coredata.chunks[path[1]][path[2]][path[3]][path[4]].split(" ")
    coredata.players[interacter][consumable[1]] += parseInt(consumable[0])
    coredata.chunks[path[1]][path[2]][path[3]][path[4]] = "-";
    var pointers = [null,null,null,null,null]
    listener.sockets.connected[interacter.slice(1)].emit('dialog', ["speech", verbage, pointers]);
    return;
  }
  if (path[0] == "loot"){
    console.log("looting path: " + path)
    path.splice(0,1,"swap")
    var verbage = ["== Your Equipped: ==", coredata.players[interacter].slot1, coredata.players[interacter].slot2, coredata.players[interacter].slot3, "<"]
    var pointers = ["exit",path.concat(["slot1"]),path.concat(["slot2"]),path.concat(["slot3"]),"exit"]
    listener.sockets.connected[interacter.slice(1)].emit('dialog', ["loot", verbage, pointers]);
    return;
  }
  if (path[0] == "swap"){
    console.log("swapping path: " + path)
    var curItem = coredata.players[interacter][path[5]];
    coredata.players[interacter][path[5]] = coredata.chunks[path[1]][path[2]][path[3]][path[4]]
    coredata.chunks[path[1]][path[2]][path[3]][path[4]] = curItem
    var verbage = ["","Your " + curItem, "has been replaced with", coredata.players[interacter][path[5]], ""]
    var pointers = [null,null,null,null,null]
    listener.sockets.connected[interacter.slice(1)].emit('dialog', ["loot", verbage, pointers]);
    return;
  }
  var verbageOptions = globals.dialogdb[path[0]][path[1]].textVariations.length - 1;
  var verbage = globals.dialogdb[path[0]][path[1]].textVariations[Math.round(Math.random() * verbageOptions)];
  var pointers = globals.dialogdb[path[0]][path[1]].pointers;
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["speech", verbage, pointers]);
}

function showLoot(interacter, name, chunk, nameType){
  db = coredata.chunks[chunk]
  var verbage = []
  var thing = db[nameType][name];
  var pointers = []
  console.log(thing,Object.keys(thing.inventory).length)
  for (var obj in thing.inventory){
    verbage.push([obj])
    pointers.push([chunk,nameType,name,obj])
  }
  for (var i=verbage.length)
  for (var obj  in coredata.players[interacter].inventory){
    verbage.push([obj])
    pointers.push([chunk,nameType,name,obj])
  }
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["loot", verbage, pointers]);
  console.log(verbage)
}

function showGrave(interacter, name, chunk, nameType){
  var verbage = ["You have bound","yourself to this grave.",". . . ","You will respawn here","If you die."]
  var pointers = ["exit"];
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["speech", verbage, pointers]);
  db[nameType][name].state = 67;
  coredata.players[interacter].health = coredata.players[interacter].maxHealth;
  var newpos = db[nameType][name].pos.split(".")[0] + "." + (parseInt(db[nameType][name].pos.split(".")[1]) + 6);
  coredata.players[interacter].origin = newpos;
}

function startDialog(interacter){
  var distance = 4;
  var player = coredata.players[interacter]
  var interacterTeam = player.team;
  var direction = player.dir;
  var atpos = player.pos.split(".");
  var at
  switch(direction){
    case "2":
      atpos[1] = parseInt(atpos[1]) - distance
      at = {"h": 6, "w": 6}
      break;
    case "6":
      atpos[1] = parseInt(atpos[1]) + distance
      at = {"h": 6, "w": 6}
      break;
    case "4":
      at = {"h": 6, "w": 6}
      atpos[0] = parseInt(atpos[0]) + distance
      break;
    case "8":
      atpos[0] = parseInt(atpos[0]) - distance
      at = {"h": 6, "w": 6}
      break;
  }
  atpos = atpos.join(".");
  general.Collission(atpos, at.w, at.h, function(result){
    for (hit in result[1]){
      var name = result[1][hit][0]
      var chunk = result[1][hit][1]
      var nameType = result[1][hit][2]
      if (chunk == "none"){ continue } else { db = coredata.chunks[chunk]}
      if (nameType == "colliders"){continue;};
      if (db[nameType][name].hasOwnProperty("singleMessage")){ getDialog(interacter, [db[nameType][name].properName, db[nameType][name].singleMessage]) };
      if (nameType == "entities" && db[nameType][name].hasOwnProperty("grave")){
        showGrave(interacter, name, chunk, nameType)
        break;
      }
      if (nameType == "entities" && db[nameType][name].slot1 != null){
        if (db[nameType][name].state < 60){db[nameType][name].state = 67}
        showLoot(interacter, name, chunk, nameType)
        break;
      } else if (nameType == "entities"){ console.log("nothing to interact with");continue;};
      if (db[nameType][name].state >= 60 ){
        showLoot(interacter, name, chunk, nameType)
        break;
      }
      if (db[nameType][name].hasOwnProperty("team")){
        if (db[nameType][name].hasOwnProperty("properName")){
          getDialog(interacter, [db[nameType][name].properName, "start"])
          console.log("GetSpeachWith", name, db[nameType][name].properName)
        } else if (db[nameType][name].team == interacterTeam) {
          getDialog(interacter, ["TeamStandard", "start"])
          console.log("GetSpeachWith", name)
        }else{
          getDialog(interacter, ["NonTeamStandard", "start"])
          console.log("GetSpeachWith", name)
        }
      };
    };
  });
};
