var ELEMENTS = {
  map: $('#map'),
  mapImage: $('#map img')
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
    this.element = $("<div class='event-dialog'></div>");
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
    var image = firstpage.image;
    this.element.html(eventTemplate({
      image: {
        path: "/img/characters/" + image.characterName + ".png",
        x: (image.characterIndex % 4)*144 + image.pattern*48,
        y: Math.floor(image.characterIndex / 4)*192 + (image.direction/2-1)*48
      }
             /*
"image": {
            "tileId": 0,
            "characterName": "People3",
            "direction": 2,
            "pattern": 1,
            "characterIndex": 7
          },
              */
    }));
    this.element.dialog("option", "title", "Event ID: " + ev.data.id);
    this.element.dialog("open");
  },
  apply: function() {
  },
  close: function() {
    this.element.dialog("close");
  }
};

ELEMENTS.map.on("click", ".map-event", function(ev) {
  var eventId = $(ev.target).data("id");
  eventDialog.openFor(events[eventId]);
});

eventDialog.create();
