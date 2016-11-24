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
    var operators = ["=", "+=", "-=", "*=", "/=", "%="];

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
    var operatorIndexes = {"=" : 0, "+=" : 1, "-=" : 3, "*=" : 4, "/=" : 5, "%=" : 6};
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
        obj.leftSwitch = params[1];
        obj.rightValue = params[2];
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
        obj.leftSwitch = params[1];
        obj.rightValue = params[2]
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
      params[1] = obj.leftSwitch;
      params[2] = obj.rightValue;
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
      params[1] = obj.leftSwitch;
      params[2] = obj.rightValue;
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
