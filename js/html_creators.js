HtmlCreators = {};
HtmlCreators.htmlFor = function(commands) {
  var all = commands.all;
  var ul = "<ul id='commands-"+ commands.id +"' class='commands' data-id='" + commands.id + "'>";
  for(var i = 0; i<all.length; i++) {
    var command = all[i];
    ul += HtmlCreators.htmlForOne(command);
  }
  ul += "</ul>";
  ul += "<div class='add-command' data-collection-id='" + commands.id + "'><button>Add Command</button></div>"
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
    var html = 'Say: "' + command.text + '"';
    if(command.name) {
      html = command.name + " s" + html.slice(1, html.length);
    }
    return "<p class='command-header'>" + new Handlebars.SafeString(html) + "</p>";
  }
};

HtmlCreators.ControlVariables = {
  htmlFor: function(command){
    var html = "";
    if(command.idsRange[1] - command.idsRange[0] > 0) {
      html += "All variables between #" + command.idsRange[0]._format(4) + " ~ #" + command.idsRange[1]._format(4);
    } else {
      html += "Variable #" + command.idsRange[0]._format(4);
    }
    html += " " + command.operator + " ";

    if(command.type === "Constant") {
      html += command.value
    } else if(command.type === "Variable") {
      html += "variable #" + command.variableId._format(4);
    } else if(command.type === "Random") {
      html += "random value between " + command.min + " and " + command.max;
    }
    return "<p class='command-header'>" + html + "</p>";
  }
};

HtmlCreators.ConditionalBranch = {
  htmlFor: function(command) {
    var html = "<p class='command-header'>If " + this.htmlForCondition(command) + "</p>";
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
  },
  htmlForCondition: function(command) { 
    if(command.type === "Switch") {
      return "switch #" + command.leftSwitch + " = " + (command.rightValue === 0 ? "true" : "false");
    } else if(command.type === "Variable") {
      var html = "variable #" + command.left.variableId._format(4) + " " + command.operator + " ";
      if(command.right.type === "Constant") {
        html += command.right.value;
      } else {
        html += "variable #" + command.right.variableId._format(4);
      }
      return html;
    } else if(command.type === "SelfSwitch") {
      obj.type = "SelfSwitch";
      return "self-switch #" + command.leftSwitch._format(4) + " = " + (command.rightValue === 0 ? "true" : "false");
    } else if(command.type === "Timer") {
      return "timer " + command.operator + " " + obj.seconds + " seconds";
    }
  }
};

HtmlCreators.Default = {
  htmlFor: function(command){return "<p class='command-header'>" + command.command + "</p>";}
};
