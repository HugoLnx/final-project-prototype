(function() {
  var elementsByType = {};
  var _currentCallback = null;
  CommandModelDialogs = {};
  CommandModelDialogs.initializeAll = function() {
    var elements = $(".command-model-dialog");
    for(var i = 0; i<elements.length; i++) {
      var element = $(elements[i]);
      var modelType = element.data("type");
      var modelDialog = CommandModelDialogs[modelType];
      elementsByType[modelType] = element;
      element.dialog({
        title: modelDialog.title,
        autoOpen: false,
        modal: true,
        resizable: false,
        width: modelDialog.width
      });
      element.on("click", ".ok", function(event) {
        var data = modelDialog.getDataFrom(element);
        element.dialog("close");
        _currentCallback(data);
      });

      element.on("click", ".cancel", function(event) {
        element.dialog("close");
        _currentCallback(null);
      });
    }
  };

  CommandModelDialogs.open = function(type, currentData, callback) {
    var element = elementsByType[type];
    var modelDialog = CommandModelDialogs[type];
    modelDialog.putDataOn(element, currentData);
    _currentCallback = callback;
    element.dialog("open");
  };

  CommandModelDialogs.ShowText = {
    title: "Show Text",
    width: 300,
    getDataFrom: function(dialogElement) {
      return Commands.build("ShowText", {
        name: dialogElement.find(".name").val(),
        text: dialogElement.find(".text").val()
      });
    },
    putDataOn: function(dialogElement, data) {
      dialogElement.find(".name").val(data.name);
      dialogElement.find(".text").val(data.text);
    }
  };
  $(function() {
    CommandModelDialogs.initializeAll();
  });
}());
