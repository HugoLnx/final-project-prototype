var ELEMENTS = {
  map: $('#map'),
  mapImage: $('#map img'),
  eventWindowContainer: $('.eventWindowContainer')
};
var eventTemplate = Handlebars.compile($("#event-template").html());

var dataMap = JSON.parse(localStorage['$dataMap']);
var events = [];

for(var i = 1; i<dataMap.events.length; i++) {
  var ev = dataMap.events[i];
  var div = $("<div class='map-event'></div>");
  div.data("id", ev.id);
  div.css({left: ev.x * 48 + 4, top: ev.y * 48 + 4});
  ELEMENTS.map.append(div);
  events[i] = {data: ev, div: div};
}

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

var eventDialog = {
  element: null,
  ev: null,
  create: function() {
    this.element = $(".event-dialog");
    this.element.dialog({
      autoOpen: false,
      modal: true,
      resizable: false,
      width: 900,
      height: 600
    });
  },
  openFor: function(ev) {
    this.ev = ev;
    var firstpage = ev.data.pages[0];
    this.element.html(eventTemplate({
      image: imagePropertiesFrom(firstpage.image),
      commands: commandsFrom(firstpage.list)
    }));
    this.element.dialog("option", "title", "Event ID: " + ev.data.id);
    this.element.dialog("open");
    var commands = $(".commands");
    commands.sortable({
      connectWith: ".commands",
      dropOnEmpty: true,
      placeholder: "ui-state-highlight",
      forcePlaceholderSize: true,
      cursor: "grabbing",
      axis: "y",
      tolerance: "intersect",
      scroll: false
    });
    onCommandMove(commands, function(details) {
      var itemId = details.item.data("id");
      var senderCollection = Commands.collectionById[details.sender.data("id")];
      var receiverCollection = Commands.collectionById[details.receiver.data("id")];
      var inx = details.item.prevAll(".command").length;
      senderCollection.all._removeIf(function(command){return command.id === itemId;});
      receiverCollection.all._insertAt(inx, Commands.commandById[itemId]);
      //console.log(CommandParsers.unparse(window.commands, 0));
      var dataMap = JSON.parse(localStorage['$dataMap']);
      dataMap.events[5].pages[0].list = CommandParsers.unparse(window.commands, 0);
      localStorage['$dataMap'] = JSON.stringify(dataMap);
    });
  },
  apply: function() {
  },
  close: function() {
    this.element.dialog("close");
  }
};

function onCommandMove(commands, action) {
  var intervals = {};

  commands.on("sortupdate", function(event, ui) {
    var item = ui.item;
    var itemId = item.data("id");
    clearInterval(intervals[itemId]);

    intervals[itemId] = setTimeout(function() {
      delete intervals[itemId];
      var sender = ui.sender;
      var receiver = $(event.target);
      var details = {
        item: item,
        sender: sender || receiver,
        receiver: receiver
      };
      action(details);
    }, 200);
  });
};

function imagePropertiesFrom(image) {
  return {
    path: "/img/characters/" + image.characterName + ".png",
    x: (image.characterIndex % 4)*144 + image.pattern*48,
    y: Math.floor(image.characterIndex / 4)*192 + (image.direction/2-1)*48
  }
}

function commandsFrom(commands) {
  var resp = CommandParsers.parse(commands, 0);
  window.commands = resp.commands;
  return resp.commands;
}

CommandParsers = {};

CommandParsers.parse = function(commands, i) {
  var command = commands[i];
  if(command === undefined) return {commands: null, nextI: null};

  var objects = Commands.buildCollection();

  var indent = command.indent;
  while(i !== null && commands[i].code !== 0) {
    var resp = CommandParsers.parseOne(commands, i);
    objects.all.push(resp.object);

    i = resp.nextI;
  }
  var nextI = i+1;
  if(nextI >= commands.length) nextI = null;
  return {commands: objects, nextI: nextI};
};

CommandParsers.parseOne = function(commands, i) {
  var command = commands[i];
  var code2parser = {
    '101': 'ShowText',
    '122': 'ControlVariables',
    '111': 'ConditionalBranch'
  };
  var moduleName = code2parser[command.code];
  console.log("".padStart(command.indent*2), command.code, moduleName);
  var resp = CommandParsers[moduleName].parse(commands,i);
  console.log("".padStart(command.indent*2), command.code, moduleName, "*");
  return resp;
}

CommandParsers.unparse = function(collection, indent) {
  var objects = collection.all;
  var commands = [];
  for(var i = 0; i<objects.length; i++) {
    var object = objects[i];
    var newCommands = CommandParsers[object.command].unparse(object, indent);
    Array.prototype.push.apply(commands, newCommands);
  }
  commands.push({
    "code": 0,
    "indent": indent,
    "parameters": []
  });
  return commands;
};

CommandParsers.ShowText = {
  parse: function(commands, i) {
    var nextCommand = commands[i+1];
    var text = nextCommand.parameters[0];
    var match = text.match(/^([^:]*)\s*:\s*(.*)$/)

    var obj = Commands.build("ShowText", {
      name: (match ? match[1] : null),
      text: (match ? match[2] : text)
    });

    return {object: obj, nextI: i + 2};
  },
  unparse: function(obj, indent) {
    var commands = [];
    commands.push({
      "code": 101,
      "indent": indent,
      "parameters": ["", 0, 0, 2]
    });
    commands.push({
      "code": 401,
      "indent": indent,
      "parameters": [
        (obj.name ? obj.name + ": " : "") + obj.text
      ]
    });
    return commands;
  }
};

CommandParsers.ControlVariables = {
  parse: function(commands, i) {
    // 122
    var params = commands[i].parameters;
    var operators = ["=", "+", "-", "*", "/", "%"];

    var obj = Commands.build("ControlVariables", {
      idsRange: [params[0], params[1]],
      operator: operators[params[2]]
    });

    switch (params[3]) {  // Operand
    case 0:  // Constant
        obj.type = "Constant";
        obj.value = params[4];
        break;
    case 1:  // Variable
        obj.type = "Variable";
        obj.variableId = params[4];
        break;
    case 2:  // Random
        obj.type = "Random";
        obj.min = params[4];
        obj.max = params[5];
        break;
    }

    return {object: obj, nextI: i + 1};
  },
  unparse: function(obj, indent) {
    var operatorIndexes = {"=" : 0, "+" : 1, "-" : 3, "*" : 4, "/" : 5, "%" : 6};
    var code = 122;
    var params = [];
    params[0] = obj.idsRange[0];
    params[1] = obj.idsRange[1];
    params[2] = operatorIndexes[obj.operator];
    if(obj.type === "Constant") {
      params[3] = 0;
      params[4] = obj.value;
    } else if(obj.type === "Variable") {
      params[3] = 1;
      params[4] = obj.variableId;
    } else if(obj.type === "Random") {
      params[3] = 2;
      params[4] = obj.min;
      params[5] = obj.max;
    }
    return [{code: code, parameters: params, indent: indent}];
  }
};

CommandParsers.ConditionalBranch = {
  parse: function(commands, i) {
    // 111
    var params = commands[i].parameters;
    var obj = Commands.build("ConditionalBranch");
    switch (params[0]) {
    case 0:  // Switch
        obj.type = "Switch";
        obj.switches = [params[1], params[2]];
        break;
    case 1:  // Variable
        obj.type = "Variable";
        obj.left = {
          type: "Variable",
          variableId: params[1]
        }
        obj.right = {};
        if (params[2] === 0) {
            obj.right.type = "Constant";
            obj.right.value = params[2];
        } else {
            obj.right.type = "Variable";
            obj.right.variableId = params[2];
        }
        var operators = ["=", ">=", "<=", ">", "<", "<>"];
        obj.operator = operators[params[4]];
        break;
    case 2:  // Self Switch
        obj.type = "SelfSwitch";
        obj.switchKey = params[1];
        break;
    case 3:  // Timer
        obj.type = "Timer";
        obj.operator = params[2] === 0 ? ">=" : "<=";
        obj.seconds = params[1];
        break;
    }

    var resp = CommandParsers.parse(commands, i+1);
    obj.thenChildren = resp.commands;

    if(commands[resp.nextI].code === 411) {
      resp = CommandParsers.parse(commands, resp.nextI+1);
      obj.elseChildren = resp.commands;
    }

    return {object: obj, nextI: resp.nextI+1};
  },
  unparse: function(obj, indent) {
    var commands = [];
    var params = [];

    if(obj.type === "Switch") {
      params[0] = 0;
      params[1] = obj.switches[0];
      params[2] = obj.switches[1];
    } else if(obj.type === "Variable") {
      params[0] = 1;
      params[1] = obj.left.variableId;
      if(obj.right.type === "Constant") {
        params[2] = 0;
        params[3] = obj.right.value;
      } else {
        params[2] = 1;
        params[3] = obj.right.variableId;
      }
      var operatorIndexes = {"=":0, ">=":1, "<=":2, ">":3, "<":4, "<>":5};
      params[4] = operatorIndexes[obj.operator];
    } else if(obj.type === "SelfSwitch") {
      params[0] = 2;
      params[1] = obj.switchKey;
    } else if(obj.type === "Timer") {
      params[0] = 3;
      params[1] = obj.seconds;
      params[2] = (obj.operator === ">=" ? 0 : 1);
    }

    commands.push({
      "code": 111,
      "indent": indent,
      "parameters": params
    });

    var thenCommands = CommandParsers.unparse(obj.thenChildren, indent+1);
    Array.prototype.push.apply(commands, thenCommands);

    if(obj.elseChildren.all.length > 0) {
      commands.push({
        "code": 411,
        "indent": indent,
        "parameters": []
      });

      var elseCommands = CommandParsers.unparse(obj.elseChildren, indent+1);
      Array.prototype.push.apply(commands, elseCommands);
    }
    commands.push({
      "code": 412,
      "indent": indent,
      "parameters": []
    });
    return commands;
  }
};

ELEMENTS.map.on("click", ".map-event", function(ev) {
  var eventId = $(ev.target).data("id");
  eventDialog.openFor(events[eventId]);
});

eventDialog.create();

Handlebars.registerHelper("commands-list", function(commands) {
  return new Handlebars.SafeString(HtmlCreators.htmlFor(commands));
});

HtmlCreators = {};
HtmlCreators.htmlFor = function(commands) {
  var all = commands.all;
  var ul = "<ul class='commands' data-id='" + commands.id + "'>";
  for(var i = 0; i<all.length; i++) {
    var command = all[i];
    ul += "<li class='command' data-id='" + command.id + "'>";
    ul += HtmlCreators.htmlForOne(command);
    ul += "</li>"; 
  }
  ul += "</ul>";
  return ul;
}

HtmlCreators.htmlForOne = function(command) {
  return (HtmlCreators[command.command] || HtmlCreators.Default).htmlFor(command);
};

HtmlCreators.ConditionalBranch = {
  htmlFor: function(command) {
    var html = "<p class='command-header'>" + command.command + "</p>";
    html += "<ul class='branches'>";
    html += "<li class='branch'>";
    html += "<p class='branch-title'>Then</p>";
    html += HtmlCreators.htmlFor(command.thenChildren);
    html += "</li>";
    if (command.elseChildren !== undefined) {
      html += "<li class='branch'>";
      html += "<p class='branch-title'>Else</p>";
      html += HtmlCreators.htmlFor(command.elseChildren);
      html += "</li>";
    }
    html += "</ul>"
    return html;
  }
};

HtmlCreators.Default = {
  htmlFor: function(command){return "<p class='command-header'>" + command.command + "</p>";}
};

(function() {
  var hoveredElement = null;
  var timeout = null;

  $(".event-dialog").on("mouseover", ".command", function(event) {
    event.stopPropagation();
    if(hoveredElement === null || $(hoveredElement).data('id') !== $(event.currentTarget).data('id')) {
      hoveredElement && hoveredElement.classList.remove("hovered");
      hoveredElement = event.currentTarget;
      hoveredElement.classList.add("hovered");
    }
    clearTimeout(timeout);
    setTimeout(function() {
      hoveredElement && hoveredElement.classList.remove("hovered");
      hoveredElement = null;
    }, 30000);
  });

  $(".event-dialog").on("mouseout", ".command", function(event) {
      hoveredElement && hoveredElement.classList.remove("hovered");
      hoveredElement = null;
      event.currentTarget.classList.remove("hovered");
  });
}());

Array.prototype._insertAt = function() {
  var params = [];
  for(var i = 0; i<arguments.length; i++) {
    var argument = arguments[i];
    params.push(argument);
  }
  params.splice(1,0,0);
  Array.prototype.splice.apply(this, params);
};

Array.prototype._remove = function(position) {
  Array.prototype.splice.call(this, position, 1);
};

Array.prototype._removeIf = function(condition) {
  for(var i = 0; i<this.length; i++) {
    var element = this[i];
    if(condition(element)) {
      this._remove(i);
      break;
    }
  }
};

function toClipboard(text) {
  var div = document.createElement("div");
  div.textContent = text;
  div.focus();
  document.execCommand("SelectAll");
  document.execCommand("Copy");
}
