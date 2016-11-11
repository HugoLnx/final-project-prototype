var Commands = {
  nextCommandId: 0,
  commandById: {},
  nextCollectionId: 0,
  collectionById: {},
  build: function(type, props){
    var id = this.nextCommandId++;
    var obj = {id: id, command: type};
    for(var prop in props) {
      if(props.hasOwnProperty(prop)) {
        obj[prop] = props[prop];
      }
    }
    this.commandById[id] = obj;
    return obj;
  },
  buildCollection: function() {
    var id = this.nextCollectionId++;
    var objs = {all: [], id: id};
    this.collectionById[id] = objs;
    objs.id = id;
    return objs;
  }
}

function saveDataMap() {
  var dataMap = JSON.parse(localStorage['$dataMap']);
  dataMap.events[window.currentEventId].pages[0].list = CommandParsers.unparse(window.commands, 0);
  localStorage['$dataMap'] = JSON.stringify(dataMap);
}
