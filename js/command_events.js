(function() {
  var eventDialog = $(".event-dialog");

  CommandEvents = {
    bind: function() {
      var commands = $(".commands");
      commands.sortable({
        connectWith: ".commands",
        dropOnEmpty: true,
        placeholder: "ui-state-highlight",
        forcePlaceholderSize: true,
        cursor: "grabbing",
        axis: "y",
        tolerance: "intersect",
        scroll: false
      });
      onCommandMove(commands, function(details) {
        var itemId = details.item.data("id");
        var senderCollection = Commands.collectionById[details.sender.data("id")];
        var receiverCollection = Commands.collectionById[details.receiver.data("id")];
        var inx = details.item.prevAll(".command").length;
        senderCollection.all._removeIf(function(command){return command.id === itemId;});
        receiverCollection.all._insertAt(inx, Commands.commandById[itemId]);
      });
    }
  };

  function onCommandMove(commands, action) {
    var intervals = {};

    commands.on("sortupdate", function(event, ui) {
      var item = ui.item;
      var itemId = item.data("id");
      clearInterval(intervals[itemId]);

      intervals[itemId] = setTimeout(function() {
        delete intervals[itemId];
        var sender = ui.sender;
        var receiver = $(event.target);
        var details = {
          item: item,
          sender: sender || receiver,
          receiver: receiver
        };
        action(details);
      }, 200);
    });
  };



  (function() {
    var hoveredElement = null;
    var timeout = null;

    eventDialog.on("mouseover", ".commands-container .add-command", function(event) {
      event.stopPropagation();
    });

    eventDialog.on("mouseover", ".command", function(event) {
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

    eventDialog.on("mouseout", ".command", function(event) {
        hoveredElement && hoveredElement.classList.remove("hovered");
        hoveredElement = null;
        event.currentTarget.classList.remove("hovered");
    });
  }());

  eventDialog.on("click", ".add-command", function(event) {
    var collectionId = $(this).data("collection-id");
    CommandsPicker.pickCommand(function(obj) {
      Commands.collectionById[collectionId].all.push(obj);
      $("#commands-" + collectionId).append(HtmlCreators.htmlForOne(obj));
    });
  });

  eventDialog.on("click", ".ok", function(event) {
    saveDataMap();
    eventDialog.dialog("close");
  });

  eventDialog.on("click", ".cancel", function(event) {
    eventDialog.dialog("close");
  });
}());
