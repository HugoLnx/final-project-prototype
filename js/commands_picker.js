(function() {
  var SELECTOR = "#commands-picker-dialog";
  var COMMAND_MODEL_GROUPS = [
    {
      title: "Message",
      commandModels: [
        {title: "Show Text", command: "ShowText"},
        {title: "Show Choices"},
        {title: "Input Number"},
        {title: "Select Item"},
        {title: "Show Scrolling Text"}
      ]
    },
    {
      title: "Game Progression",
      commandModels: [
        {title: "Control Switches"},
        {title: "Control Variables", command: "ControlVariables"},
        {title: "Control Self Switch"},
        {title: "Control Timer"}
      ]
    },
    {
      title: "Flow Control",
      commandModels: [
        {title: "Conditional Branch", command: "ConditionalBranch"},
        {title: "Loop"},
        {title: "Break Loop"},
        {title: "Exit Event Processing"},
        {title: "Common Event"},
        {title: "Label"},
        {title: "Jump to Label"},
        {title: "Comment"}
      ]
    },
    {
      title: "Party",
      commandModels: [
        {title: "Change Gold"},
        {title: "Change Items"},
        {title: "Change Weapons"},
        {title: "Change Armors"},
        {title: "Change Party member"}
      ]
    },
    {
      title: "Actor",
      commandModels: [
        {title: "Change HP"},
        {title: "Change MP"},
        {title: "Change TP"},
        {title: "Change State"},
        {title: "Recover All"},
        {title: "Change EXP"},
        {title: "Change Level"},
        {title: "Change Parameter"},
        {title: "Change Skill"},
        {title: "Change Equipment"},
        {title: "Change Name"},
        {title: "Change Class"},
        {title: "Change Nickname"},
        {title: "Change Profile"}
      ]
    }
  ];
  var _element = null;
  var _template = Handlebars.compile($("#commands-picker-template").html());
  var _currentCallback = null;

  CommandsPicker = {
    initialize: function() {
      createCommandModelMenus();
      initializeDialog();
      bindEvents();
    },
    getElement: function() {
      if (_element === null) _element = $(SELECTOR);
      return _element;
    },
    pickCommand: function(callback) {
      _currentCallback = callback;
      CommandsPicker.getElement().dialog("open");
    }
  };

  function createCommandModelMenus() {
    var html = _template({commandModelGroups: COMMAND_MODEL_GROUPS});
    CommandsPicker.getElement().find(".command-model-groups").html(html);
  }

  function initializeDialog() {
    CommandsPicker.getElement().dialog({
      title: "Select the command",
      autoOpen: false,
      modal: true,
      resizable: false,
      width: 550,
      height: 600
    });
  }

  function bindEvents() {
    CommandsPicker.getElement().on("click", ".command-model button", function(event) {
      var btn = $(this);
      var type = btn.data("command");
      CommandModelDialogs.open(type, {}, function(obj) {
        _currentCallback(obj);
      });
    });
  }

  $(function() {
    CommandsPicker.initialize();
  });
}());
