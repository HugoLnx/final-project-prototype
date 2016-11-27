Array.prototype._insertAt = function() {
  var params = [];
  for(var i = 0; i<arguments.length; i++) {
    var argument = arguments[i];
    params.push(argument);
  }
  params.splice(1,0,0);
  Array.prototype.splice.apply(this, params);
};

Array.prototype._remove = function(position) {
  Array.prototype.splice.call(this, position, 1);
};

Array.prototype._removeIf = function(condition) {
  for(var i = 0; i<this.length; i++) {
    var element = this[i];
    if(condition(element)) {
      this._remove(i);
      break;
    }
  }
};

Array.prototype._clone = function() {
  return Array.apply(null, this);
};

Number.prototype._format = function(minIntegerDigits) {
  var str = this+"";
  while(str.length < minIntegerDigits) {
    str = "0" + str;
  }
  return str;
};

function toClipboard(text) {
  var div = document.createElement("div");
  div.textContent = text;
  div.focus();
  document.execCommand("SelectAll");
  document.execCommand("Copy");
}
