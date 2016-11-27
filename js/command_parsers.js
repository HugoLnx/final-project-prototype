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
    '102': 'ShowChoices',
    '103': 'InputNumber',
    '104': 'SelectItem',
    '105': 'ShowScrollingText',
    '111': 'ConditionalBranch',
    '112': 'Loop',
    '113': 'BreakLoop',
    '115': 'ExitEventProcessing',
    '117': 'CommonEvent',
    '118': 'Label',
    '119': 'JumpToLabel',
    '121': 'ControlSwitches',
    '122': 'ControlVariables',
    '123': 'ControlSelfSwitches',
    '124': 'ControlTimer'
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

CommandParsers.Loop = {
  // 112
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("Loop", {});
    var resp = CommandParsers.parse(commands, i+1);
    obj.children = resp.commands;
    return {object: obj, nextI: resp.nextI+1};
  },
  unparse: function(obj, indent) {
    var commands = [{
      "code": 112,
      "indent": indent,
      "parameters": []
    }];
    var innerCommands = CommandParsers.unparse(obj.children, indent+1);
    Array.prototype.push.apply(commands, innerCommands);
    commands.push({
      "code": 413,
      "indent": indent,
      "parameters": []
    });
    return commands;
  }
};

CommandParsers.BreakLoop = {
  // 113
  parse: function(commands, i) {
    var obj = Commands.build("BreakLoop", {});
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 113,
      "indent": indent,
      "parameters": []
    }];
  }
};

CommandParsers.ExitEventProcessing = {
  // 115
  parse: function(commands, i) {
    var obj = Commands.build("ExitEventProcessing", {});
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 115,
      "indent": indent,
      "parameters": []
    }];
  }
};

CommandParsers.CommonEvent = {
  // 117
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("CommonEvent", {
      eventId: params[0]
    });
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 117,
      "indent": indent,
      "parameters": [obj.eventId]
    }];
  }
};

CommandParsers.Label = {
  // 118
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("Label", {
      name: params[0]
    });
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 118,
      "indent": indent,
      "parameters": [obj.name]
    }];
  }
};

CommandParsers.JumpToLabel = {
  // 119
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("JumpToLabel", {
      name: params[0]
    });
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 119,
      "indent": indent,
      "parameters": [obj.name]
    }];
  }
};

CommandParsers.InputNumber = {
  // 103
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("InputNumber", {
      variableId: params[0],
      digits: params[1]
    });
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 103,
      "indent": indent,
      "parameters": [obj.variableId, obj.digits]
    }];
  }
};

CommandParsers.SelectItem = {
  // 104
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var obj = Commands.build("SelectItem", {
      variableId: params[0],
      type: params[1]
    });
    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 104,
      "indent": indent,
      "parameters": [obj.variableId, obj.type]
    }];
  }
};

CommandParsers.ShowScrollingText = {
  // 105
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var nextParams = commands[i+1].parameters;

    var obj = Commands.build("ShowScrollingText", {
      speed: params[0],
      blockFastForward: params[1],
      text: nextParams[0]
    });

    return {object: obj, nextI: i+2};
  },
  unparse: function(obj, indent) {
    return [
      {
        "code": 105,
        "indent": indent,
        "parameters": [obj.speed, obj.blockFastForward]
      },
      {
        "code": 405,
        "indent": indent,
        "parameters": [obj.text]
      }
    ];
  }
};

CommandParsers.ControlSwitches = {
  // 121
  parse: function(commands, i) {
    var params = commands[i].parameters;

    var obj = Commands.build("ControlSwitches", {
      idsRange: [params[0], params[1]],
      value: params[2] === 0
    });

    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 121,
      "indent": indent,
      "parameters": [obj.idsRange[0], obj.idsRange[1], obj.value ? 0 : 1]
    }];
  }
};

CommandParsers.ControlSelfSwitches = {
  // 123
  parse: function(commands, i) {
    var params = commands[i].parameters;

    var obj = Commands.build("ControlSelfSwitches", {
      name: params[0],
      value: params[1] === 0
    });

    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 123,
      "indent": indent,
      "parameters": [obj.name, obj.value ? 0 : 1]
    }];
  }
};


CommandParsers.ControlTimer = {
  // 124
  parse: function(commands, i) {
    var params = commands[i].parameters;

    var obj = Commands.build("ControlTimer", {
      action: (params[0] === 0 ? "start" : "stop"),
      seconds: params[1]
    });

    return {object: obj, nextI: i+1};
  },
  unparse: function(obj, indent) {
    return [{
      "code": 124,
      "indent": indent,
      "parameters": [(obj.action === "start" ? 0 : 1), obj.seconds]
    }];
  }
};

CommandParsers.ShowText = {
  parse: function(commands, i) {
    var nextCommand = commands[i+1];
    var firstLine = nextCommand.parameters[0];
    var match = firstLine.match(/^([^:]*)\s*:\s*(.*)$/);
    var name = (match ? match[1] : null);
    var text = (match ? match[2] : firstLine);

    var nextI = i+2;
    while(commands[nextI].code === 401) {
      text += "\n" + commands[nextI].parameters[0];
      nextI++;
    }

    var obj = Commands.build("ShowText", {
      name: name,
      text: text
    });

    return {object: obj, nextI: nextI};
  },
  unparse: function(obj, indent) {
    var commands = [];
    commands.push({
      "code": 101,
      "indent": indent,
      "parameters": ["", 0, 0, 2]
    });

    var lines = obj.text.split("\n");
    commands.push({
      "code": 401,
      "indent": indent,
      "parameters": [
        (obj.name ? obj.name + ": " : "") + lines[0]
      ]
    });
    for(var i = 1; i<lines.length; i++) {
      var line = lines[i];

      commands.push({
        "code": 401,
        "indent": indent,
        "parameters": [ lines[i] ]
      });
    }
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


CommandParsers.ShowChoices = {
  parse: function(commands, i) {
    var params = commands[i].parameters;
    var choices = params[0]._clone();

    var obj = Commands.build("ShowChoices", {
      choices: choices,
      choicesChildren: {}
    });

    var nextI = i + 2;
    for(var i = 0; i<choices.length; i++) {
      var choice = choices[i];
      var resp = CommandParsers.parse(commands, nextI)
      obj.choicesChildren[choice] = resp.commands;
      nextI = resp.nextI + 1;
    }

    return {object: obj, nextI: nextI};
  },
  unparse: function(obj, indent) {
    var commands = [];
    commands.push({
      "code": 102,
      "indent": indent,
      "parameters": [obj.choices._clone(), -1, 0, 2, 0]
    });

    for(var i = 0; i<obj.choices.length; i++) {
      var choice = obj.choices[i];
      commands.push({
        "code": 402,
        "indent": indent,
        "parameters": [i, choice]
      });
      var choiceCommands = CommandParsers.unparse(
          obj.choicesChildren[choice], indent+1);
      Array.prototype.push.apply(commands, choiceCommands);
    }
    commands.push({
      "code": 404,
      "indent": indent,
      "parameters": []
    });

    return commands;
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
        obj.rightValue = params[2] === 0;
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
        obj.rightValue = params[2] === 0;
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

    if(obj.elseChildren && obj.elseChildren.all.length > 0) {
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
