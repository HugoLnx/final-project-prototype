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
    $(".commands").sortable({
      connectWith: ".commands",
      dropOnEmpty: true,
      placeholder: "ui-state-highlight",
      forcePlaceholderSize: true,
      cursor: "grabbing",
      axis: "y",
      tolerance: "intersect",
      scroll: false
    });
  },
  apply: function() {
  },
  close: function() {
    this.element.dialog("close");
  }
};

function imagePropertiesFrom(image) {
  return {
    path: "/img/characters/" + image.characterName + ".png",
    x: (image.characterIndex % 4)*144 + image.pattern*48,
    y: Math.floor(image.characterIndex / 4)*192 + (image.direction/2-1)*48
  }
}

function commandsFrom(commands) {
  resp = CommandParsers.parse(commands, 0);
  window.commands = resp.commands;
  console.log(resp.commands);
  return resp.commands;
}

CommandParsers = {};

CommandParsers.parse = function(commands, i) {
  var objects = [];
  var command = commands[i];
  if(command === undefined) return {commands: [], nextI: null};
  if(commands[commands.length-1].code === 0) {
    commands.pop();
  }

  var indent = command.indent;
  while(i != null && i < commands.length && indent === commands[i].indent) {
    var resp = CommandParsers.parseOne(commands, i);
    objects.push(resp.object);

    i = resp.nextI;
  }
  return {commands: objects, nextI: i};
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

CommandParsers.ShowText = {
  parse: function(commands, i) {
    var nextCommand = commands[i+1];
    var nextNextCommand = commands[i+2];
    var text = nextCommand.parameters[0];
    var match = text.match(/^([^:]*)\s*:\s*(.*)$/)

    var obj = {
      command: "ShowText",
      name: (match ? match[1] : ""),
      text: (match ? match[2] : text)
    };

    var nextI = nextNextCommand.code === 0 ? i + 3 : i + 2;
    return {object: obj, nextI: nextI};
  }
}

CommandParsers.ControlVariables = {
  parse: function(commands, i) {
    // 122
    var params = commands[i].parameters;
    var operators = ["=", "+", "-", "*", "/", "%"];

    var obj = {
      command: "ControlVariables",
      ids_range: [params[0], params[1]],
      operator: operators[params[2]]
    };

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
  }
};

CommandParsers.ConditionalBranch = {
  parse: function(commands, i) {
    // 111
    var params = commands[i].parameters;
    var obj = {
      command: "ConditionalBranch",
    };
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
            obj.right.variable_id = params[2];
        }
        var operators = ["=", ">=", "<=", ">", "<", "<>"];
        obj.operator = operators[params[4]];
        break;
    case 2:  // Self Switch
        obj.type = "SelfSwitch";
        obj.switch_key = params[1];
        break;
    case 3:  // Timer
        obj.type = "Timer";
        obj.operator = params[2] === 0 ? ">=" : "<=";
        obj.seconds = params[1];
        break;
    }

    var resp = CommandParsers.parse(commands, i+1);
    obj.then_children = resp.commands;

    if(commands[resp.nextI].code === 411) {
      resp = CommandParsers.parse(commands, resp.nextI+1);
      obj.else_children = resp.commands;
    }

    return {object: obj, nextI: resp.nextI+1};
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

HtmlCreators = {lastId: 0}
HtmlCreators.htmlFor = function(commands) {
  var ul = "<ul class='commands'>";
  for(var i = 0; i<commands.length; i++) {
    var command = commands[i];
    ul += "<li class='command' data-id='" + (++HtmlCreators.lastId) + "'>";
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
    html += HtmlCreators.htmlFor(command.then_children);
    html += "</li>";
    if (command.else_children !== undefined) {
      html += "<li class='branch'>";
      html += "<p class='branch-title'>Else</p>";
      html += HtmlCreators.htmlFor(command.else_children);
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
