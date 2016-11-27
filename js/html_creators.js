HtmlCreators = {};
HtmlCreators.htmlFor = function(commands) {
  var all = commands.all;
  var ul = "<ul id='commands-"+ commands.id +"' class='commands' data-id='" + commands.id + "'>";
  for(var i = 0; i<all.length; i++) {
    var command = all[i];
    ul += HtmlCreators.htmlForOne(command);
  }
  ul += "</ul>";
  ul += "<div class='add-command line' data-collection-id='" + commands.id + "'><button>Add Command</button></div>"
  return ul;
}

HtmlCreators.htmlForOne = function(command) {
  var html = "<li class='command' data-id='" + command.id + "'>";
  html += (HtmlCreators[command.command] || HtmlCreators.Default).htmlFor(command);
  html += "</li>"; 
  return html;
};

HtmlCreators.ShowText = {
  htmlFor: function(command){
    var argsHtml = 'Say ' + textConstantHtml(command.text);
    if(command.name) {
      argsHtml = command.name + " s" + argsHtml.slice(1, argsHtml.length);
    }
    var html = commandNameHtml("Show text") + argumentsHtml(argsHtml);
    return commandHeaderHtml(html)
  }
};

HtmlCreators.ControlVariables = {
  htmlFor: function(command){
    var argsHtml = "";
    if(command.idsRange[1] - command.idsRange[0] > 0) {
      var varRange = variableNameHtml(command.idsRange[0]) + " ~ " + variableNameHtml(command.idsRange[1]);
      argsHtml += varRange;
    } else {
      var varChanging = variableNameHtml(command.idsRange[0]);
      argsHtml += varChanging;
    }
    argsHtml += " " + command.operator + " ";

    if(command.type === "Constant") {
      argsHtml += numberHtml(command.value);
    } else if(command.type === "Variable") {
      argsHtml += variableNameHtml(command.variableId);
    } else if(command.type === "Random") {
      argsHtml += "random value between " + numberHtml(command.min) + " and " + numberHtml(command.max);
    }
    var html = commandNameHtml("Control variables") + argumentsHtml(argsHtml);
    return commandHeaderHtml(html)
  }
};

function commandHeaderHtml(html) {
  return "<p class='command-header line'>" + html + "</p>";
}

function numberHtml(value) {
  return "<span class='number-constant constant'>" + value + "</span>";
}

function argumentsHtml(args) {
  return "<span class='command-arguments'>" + args + "</span>";
}

function commandNameHtml(name) {
  return "<span class='command-name'>" + name + "</span>";
}

function booleanHtml(bool) {
  return "<span class='boolean-constant constant'>" + (bool ? "true" : "false") + "</span>";
}

function textConstantHtml(text) {
  var text = new Handlebars.SafeString(text);
  return "<span class='text-constant constant'>" + text + "</span>";
}

function variableNameHtml(varId) {
  return "<span class='var-id'>#" + varId._format(4) + "</span>";
}

function switchNameHtml(switchId) {
  return "<span class='switch-id'>#" + switchId._format(4) + "</span>";
}

function selfSwitchNameHtml(name) {
  return "<span class='self-switch-name'>" + name + "</span>";
}

function commonEventHtml(eventId) {
  return "<span class='common-event-id'>#" + eventId._format(4) + "</span>";
}

function labelHtml(name) {
  return "<span class='label-name'>" + name + "</span>";
}

HtmlCreators.ShowChoices = {
  htmlFor: function(command) {
    var html = commandHeaderHtml(commandNameHtml("Show choices") + argumentsHtml(command.choices.join(", ")))
    html += "<ul class='branches'>";
    for(var i = 0; i<command.choices.length; i++) {
      var choice = command.choices[i];
      html += "<li class='branch'>";
      html += "<p class='branch-title line'>" + commandNameHtml("When " + textConstantHtml(choice)) + "</p>";
      html += HtmlCreators.htmlFor(command.choicesChildren[choice]);
      html += "</li>";
    }
    html += "</ul>"
    return html;
  }
};

HtmlCreators.ConditionalBranch = {
  htmlFor: function(command) {
    var html = commandHeaderHtml(commandNameHtml("Conditional branch") + argumentsHtml("If " + this.htmlForCondition(command) + " then"))
    html += "<ul class='branches'>";
    html += "<li class='branch'>";
    //html += "<p class='branch-title'>" + argumentsHtml("Then") + "</p>";
    html += HtmlCreators.htmlFor(command.thenChildren);
    html += "</li>";
    if (command.elseChildren !== undefined) {
      html += "<li class='branch'>";
      html += "<p class='branch-title line'>" + commandNameHtml("Else") + "</p>";
      html += HtmlCreators.htmlFor(command.elseChildren);
      html += "</li>";
    }
    html += "</ul>"
    return html;
  },
  htmlForCondition: function(command) { 
    if(command.type === "Switch") {
      return switchNameHtml(command.leftSwitch) + " = " + booleanHtml(command.rightValue);
    } else if(command.type === "Variable") {
      var html = variableNameHtml(command.left.variableId) + " " + command.operator + " ";
      if(command.right.type === "Constant") {
        html += numberHtml(command.right.value);
      } else {
        html += variableNameHtml(command.right.variableId);
      }
      return html;
    } else if(command.type === "SelfSwitch") {
      obj.type = "SelfSwitch";
      return selfSwitchNameHtml(command.leftSwitch) + " = " + booleanHtml(command.rightValue);
    } else if(command.type === "Timer") {
      return "timer " + command.operator + " " + numberHtml(obj.seconds) + " seconds";
    }
  }
};

HtmlCreators.Loop = {
  htmlFor: function(command) {
    var html = commandHeaderHtml(commandNameHtml("Loop"))
    html += "<div class='branch'>";
    html += HtmlCreators.htmlFor(command.children);
    html += "</div>";
    return html;
  }
};

HtmlCreators.BreakLoop = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Break loop"))
  }
};

HtmlCreators.ExitEventProcessing = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Exit event processing"))
  }
};

HtmlCreators.CommonEvent = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Common event") + argumentsHtml("execute " + commonEventHtml(command.eventId)))
  }
};

HtmlCreators.Label = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Label") + argumentsHtml("create " + labelHtml(command.name)))
  }
};

HtmlCreators.JumpToLabel = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Jump to label") + argumentsHtml(labelHtml(command.name)))
  }
};

HtmlCreators.InputNumber = {
  htmlFor: function(command) {
    var argsHtml = argumentsHtml("store on " + variableNameHtml(command.variableId) + "; max of " + numberHtml(command.digits) + " digits");
    return commandHeaderHtml(commandNameHtml("Input number") + argsHtml)
  }
};

HtmlCreators.SelectItem = {
  htmlFor: function(command) {
    var argsHtml = argumentsHtml("store on " + variableNameHtml(command.variableId) + "; items type: " + numberHtml(command.type) + " digits");
    return commandHeaderHtml(commandNameHtml("Select item") + argsHtml)
  }
};

HtmlCreators.ShowScrollingText = {
  htmlFor: function(command) {
    var argsHtml = argumentsHtml("show " + textConstantHtml(command.text) + " at speed " + numberHtml(command.speed) + (command.blockFastForward ? "; block fast forward" : ""));
    return commandHeaderHtml(commandNameHtml("Show scrolling text") + argsHtml)
  }
};

HtmlCreators.ControlSwitches = {
  htmlFor: function(command) {
    var argsHtml = "";
    if(command.idsRange[1] - command.idsRange[0] > 0) {
      var switchRange = switchNameHtml(command.idsRange[0]) + " ~ " + switchNameHtml(command.idsRange[1]);
      argsHtml += switchRange;
    } else {
      var switchChanging = switchNameHtml(command.idsRange[0]);
      argsHtml += switchChanging;
    }
    var argsHtml = argumentsHtml("set " + argsHtml + " to " + booleanHtml(command.value));
    return commandHeaderHtml(commandNameHtml("Control switches") + argsHtml)
  }
};

HtmlCreators.ControlSelfSwitches = {
  htmlFor: function(command) {
    return commandHeaderHtml(commandNameHtml("Control self-switches") + argumentsHtml("set " + selfSwitchNameHtml(command.name) + " to " + booleanHtml(command.value)));
  }
};

HtmlCreators.ControlTimer = {
  htmlFor: function(command) {
    var argsHtml = "";
    if(command.action === "stop") {
      argsHtml = "stop";
    } else {
      argsHtml = "start; duration: " + command.seconds + " seconds";
    }
    return commandHeaderHtml(commandNameHtml("Control timer") + argumentsHtml(argsHtml));
  }
};

HtmlCreators.Default = {
  htmlFor: function(command) { return commandHeaderHtml(command.command); }
};
