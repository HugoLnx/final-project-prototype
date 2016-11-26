var dataMap = JSON.parse(localStorage['$dataMap']);
var events = [];

for(var i = 1; i<dataMap.events.length; i++) {
  var ev = dataMap.events[i];
  if(ev) {
    var div = $("<div class='map-event'></div>");
    div.data("id", ev.id);
    div.css({left: ev.x * 48 + 4, top: ev.y * 48 + 4});
    ELEMENTS.map.append(div);
    events[i] = {data: ev, div: div};
  }
}

ELEMENTS.map.on("click", ".map-event", function(event) {
  var dataMap = JSON.parse(localStorage['$dataMap']);
  for(var i = 1; i<dataMap.events.length; i++) {
    var ev = dataMap.events[i];
    if(ev) {
      events[i].data = ev;
    }
  }
  var eventId = $(event.target).data("id");
  EventDialog.openFor(events[eventId]);
});
