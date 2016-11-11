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
