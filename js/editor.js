var ELEMENTS = {
  map: $('#map'),
  mapImage: $('#map img')
};

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
    $(document.body).append(this.element);
    this.element.dialog({autoOpen: false, modal: true, resizable: false});
  },
  openFor: function(ev) {
    this.ev = ev;
    this.element.html(ev.data.name);
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
