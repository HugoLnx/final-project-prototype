var ELEMENTS = {
  map: $('#map'),
  mapImage: $('#map img'),
  eventWindowContainer: $('.eventWindowContainer')
};
var eventTemplate = Handlebars.compile($("#event-template").html());

var EventDialog = {
  element: null,
  ev: null,
  create: function() {
    this.element = $(".event-dialog");
    this.element.dialog({
      autoOpen: false,
      modal: true,
      resizable: false,
      width: 900
    });
  },
  openFor: function(ev) {
    this.ev = ev;
    var firstpage = ev.data.pages[0];
    var commands = commandsFrom(firstpage.list);
    this.element.html(eventTemplate({
      image: imagePropertiesFrom(firstpage.image),
      commands: commands
    }));

    window.commands = commands;
    window.currentEventId = ev.data.id;
    this.element.dialog("option", "title", "Event ID: " + ev.data.id);
    this.element.dialog("open");
    CommandEvents.bind();
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
  var resp = CommandParsers.parse(commands, 0);
  return resp.commands;
}

EventDialog.create();

Handlebars.registerHelper("commands-list", function(commands) {
  return new Handlebars.SafeString(HtmlCreators.htmlFor(commands));
});
