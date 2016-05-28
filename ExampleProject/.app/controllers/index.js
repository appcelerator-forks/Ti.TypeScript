"use strict";
var myClickHandler_1 = require('myClickHandler');
function doClick(e) {
    var clickHandler = new myClickHandler_1.MyClickHandler();
    var name = 'Ophir';
    clickHandler.HandleClick(name);
}
$.index.open();
