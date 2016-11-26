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
    var argsHtml = 'Say: ' + textConstantHtml(command.text);
    if(command.name) {
      argsHtml = command.name + " s" + argsHtml.slice(1, argsHtml.length);
    }
    var html = commandNameHtml("ShowText") + argumentsHtml(argsHtml);
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
    var html = commandNameHtml("ControlVariables") + argumentsHtml(argsHtml);
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
  return "<span class='boolean-constant constant'>" + (bool === 0 ? "true" : "false") + "</span>";
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
  return "<span class='self-switch-name'>#" + name + "</span>";
}

HtmlCreators.ConditionalBranch = {
  htmlFor: function(command) {
    var html = commandHeaderHtml(commandNameHtml("ConditionalBranch") + argumentsHtml("If " + this.htmlForCondition(command) + " then"))
    html += "<ul class='branches'>";
    html += "<li class='branch'>";
    //html += "<p class='branch-title'>" + argumentsHtml("Then") + "</p>";
    html += HtmlCreators.htmlFor(command.thenChildren);
    html += "</li>";
    if (command.elseChildren !== undefined) {
      html += "<li class='branch'>";
      html += "<p class='branch-title line'>" + argumentsHtml("else") + "</p>";
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

HtmlCreators.Default = {
  htmlFor: commandHeaderHtml
};
