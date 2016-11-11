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

HtmlCreators.ConditionalBranch = {
  htmlFor: function(command) {
    var html = "<p class='command-header'>" + command.command + "</p>";
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
  }
};

HtmlCreators.Default = {
  htmlFor: function(command){return "<p class='command-header'>" + command.command + "</p>";}
};